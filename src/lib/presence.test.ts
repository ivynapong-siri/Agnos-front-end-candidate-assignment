import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deriveStatus, mergePresence, type PatientPresence, type StaffSession } from './realtime'

/**
 * The staff dashboard's whole behaviour comes out of mergePresence, and it is
 * the one part that cannot be clicked through without live Supabase
 * credentials. So it gets tested directly instead.
 */

function presence(over: Partial<PatientPresence> = {}): PatientPresence {
  return {
    sessionId: 'p1',
    data: { firstName: 'Somchai' },
    submitted: false,
    filled: 1,
    total: 9,
    startedAt: 0,
    ...over,
  }
}

/** Shape of what Supabase's presenceState() returns: key -> [payload]. */
const snapshot = (...entries: PatientPresence[]): Record<string, PatientPresence[]> =>
  Object.fromEntries(entries.map((entry) => [entry.sessionId, [entry]]))

const EMPTY = new Map<string, StaffSession>()

test('a first sighting is online with nothing flagged as changed', () => {
  const merged = mergePresence(EMPTY, snapshot(presence()), 1000)
  const session = merged.get('p1')

  assert.equal(merged.size, 1)
  assert.equal(session?.online, true)
  assert.equal(session?.lastChangeAt, 1000)
  // Nothing to flash: the whole card is new.
  assert.deepEqual(session?.changed, [])
})

test('an edited field is flagged and the change is timestamped', () => {
  const first = mergePresence(EMPTY, snapshot(presence()), 1000)
  const second = mergePresence(
    first,
    snapshot(presence({ data: { firstName: 'Somchai', phone: '0812345678' }, filled: 2 })),
    5000,
  )

  assert.deepEqual(second.get('p1')?.changed, ['phone'])
  assert.equal(second.get('p1')?.lastChangeAt, 5000)
})

test('an identical payload does not reset the clock', () => {
  const first = mergePresence(EMPTY, snapshot(presence()), 1000)
  const second = mergePresence(first, snapshot(presence()), 9000)

  assert.equal(second.get('p1')?.lastChangeAt, 1000, 'a no-op sync must not look like activity')
  assert.deepEqual(second.get('p1')?.changed, [])
})

test("one patient typing does not wipe another patient's pending highlight", () => {
  const a = presence({ sessionId: 'a' })
  const b = presence({ sessionId: 'b', data: {} })

  const first = mergePresence(EMPTY, snapshot(a, b), 1000)
  // 'a' edits a field.
  const second = mergePresence(first, snapshot(presence({ sessionId: 'a', data: { firstName: 'Somchai', lastName: 'Jaidee' } }), b), 2000)
  // Now 'b' edits, in a sync where 'a' is unchanged. This is the regression:
  // presence sync fires for everyone, so 'a' must keep its own state.
  const third = mergePresence(
    second,
    snapshot(presence({ sessionId: 'a', data: { firstName: 'Somchai', lastName: 'Jaidee' } }), presence({ sessionId: 'b', data: { email: 'b@example.com' } })),
    2500,
  )

  assert.deepEqual(third.get('a')?.changed, ['lastName'], "a's highlight survived b's update")
  assert.equal(third.get('a')?.lastChangeAt, 2000)
  assert.deepEqual(third.get('b')?.changed, ['email'])
  assert.equal(third.get('b')?.lastChangeAt, 2500)
})

test('leaving marks a session offline but never deletes it', () => {
  const first = mergePresence(EMPTY, snapshot(presence()), 1000)
  const gone = mergePresence(first, {}, 4000)

  assert.equal(gone.size, 1, 'the record stays on the board')
  assert.equal(gone.get('p1')?.online, false)
  assert.equal(gone.get('p1')?.lastChangeAt, 1000, 'going offline is not activity')
  assert.equal(deriveStatus(gone.get('p1')!, 4000), 'disconnected')
})

test('a submission survives the patient closing the tab', () => {
  const filling = mergePresence(EMPTY, snapshot(presence()), 1000)
  const submitted = mergePresence(filling, snapshot(presence({ submitted: true, filled: 9 })), 2000)
  const closed = mergePresence(submitted, {}, 3000)

  assert.equal(closed.get('p1')?.submitted, true)
  // The whole reason the map is never pruned.
  assert.equal(deriveStatus(closed.get('p1')!, 999_999), 'submitted')
})

test('submitting counts as activity even when no field changed', () => {
  const first = mergePresence(EMPTY, snapshot(presence()), 1000)
  const submitted = mergePresence(first, snapshot(presence({ submitted: true })), 7000)

  assert.equal(submitted.get('p1')?.lastChangeAt, 7000)
})

test('entries that are not patients are ignored', () => {
  const noisy = {
    ...snapshot(presence()),
    // A staff tab, or any other subscriber that tracked something unexpected.
    'staff-1': [{ role: 'staff' } as unknown as PatientPresence],
    'empty-1': [] as PatientPresence[],
  }

  const merged = mergePresence(EMPTY, noisy, 1000)
  assert.deepEqual([...merged.keys()], ['p1'])
})

test('a rejoining patient reuses its own row rather than adding a second', () => {
  const first = mergePresence(EMPTY, snapshot(presence()), 1000)
  const gone = mergePresence(first, {}, 2000)
  const back = mergePresence(gone, snapshot(presence()), 3000)

  assert.equal(back.size, 1)
  assert.equal(back.get('p1')?.online, true)
})
