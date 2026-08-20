import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  EXIT_MS,
  channelFor,
  deriveStatus,
  mergePresence,
  pruneDeparted,
  type PatientPresence,
  type StaffSession,
} from './realtime'

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

test('leaving stamps a departure rather than vanishing mid-animation', () => {
  const first = mergePresence(EMPTY, snapshot(presence()), 1000)
  const gone = mergePresence(first, {}, 4000)

  assert.equal(gone.size, 1, 'still rendered, so it can animate out')
  assert.equal(gone.get('p1')?.online, false)
  assert.equal(gone.get('p1')?.leavingAt, 4000)
  assert.equal(gone.get('p1')?.lastChangeAt, 1000, 'going offline is not activity')
  assert.equal(deriveStatus(gone.get('p1')!, 4000), 'disconnected')
})

test('a departure is stamped once, not refreshed by every later sync', () => {
  const first = mergePresence(EMPTY, snapshot(presence()), 1000)
  const gone = mergePresence(first, {}, 4000)
  // Presence sync fires for everyone; a second one must not restart the exit.
  const later = mergePresence(gone, {}, 4200)

  assert.equal(later.get('p1')?.leavingAt, 4000, 'the original departure time stands')
})

test('the row is pruned only once its exit animation has run', () => {
  const gone = mergePresence(mergePresence(EMPTY, snapshot(presence()), 1000), {}, 4000)

  assert.equal(pruneDeparted(gone, 4000 + EXIT_MS - 1).size, 1, 'still animating')
  assert.equal(pruneDeparted(gone, 4000 + EXIT_MS).size, 0, 'animation done, row gone')
})

test('a patient who comes back is not pruned mid-form', () => {
  const gone = mergePresence(mergePresence(EMPTY, snapshot(presence()), 1000), {}, 4000)
  const back = mergePresence(gone, snapshot(presence()), 4100)

  assert.equal(back.get('p1')?.leavingAt, undefined, 'the pending departure is cancelled')
  assert.equal(pruneDeparted(back, 9999).size, 1, 'and it survives a later sweep')
})

test('a submission survives the patient closing the tab', () => {
  const filling = mergePresence(EMPTY, snapshot(presence()), 1000)
  const submitted = mergePresence(filling, snapshot(presence({ submitted: true, filled: 9 })), 2000)
  const closed = mergePresence(submitted, {}, 3000)

  assert.equal(closed.get('p1')?.submitted, true)
  assert.equal(closed.get('p1')?.leavingAt, undefined, 'a completed intake is not a departure')
  // A submitted row is the record staff most needs; it must outlive the sweep.
  assert.equal(pruneDeparted(closed, 999_999).size, 1)
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
  assert.equal(back.get('p1')?.leavingAt, undefined)
})

test('the optional room is derived from the URL and sanitised', () => {
  // Default: everyone shares one channel, which is the clinic's front desk.
  assert.equal(channelFor(''), channelFor('?other=1'))
  assert.notEqual(channelFor('?room=demo'), channelFor(''))
  assert.equal(channelFor('?room=demo'), channelFor('?room=demo'), 'same room, same channel')
  assert.notEqual(channelFor('?room=demo'), channelFor('?room=other'))

  // The room name comes from the URL, so it is untrusted input.
  assert.equal(channelFor('?room=a/b*c'), channelFor('?room=abc'), 'punctuation stripped')
  assert.equal(channelFor('?room=  '), channelFor(''), 'blank falls back to the shared channel')
  const long = channelFor(`?room=${'x'.repeat(200)}`)
  assert.ok(long.length < 80, 'room length is capped')
})
