'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import { FIELDS, type FieldName } from './fields'
import type { PatientForm } from './schema'

/**
 * Transport: Supabase Realtime **Presence** on a single shared channel.
 *
 * Presence is chosen over Broadcast deliberately. Presence already solves the
 * three hard parts of this feature for free:
 *   - late join      staff opening the dashboard mid-form gets every current
 *                    value in the first `sync` event
 *   - disconnect     closing the tab removes the entry, no heartbeat to write
 *   - shared state   the payload *is* the state, so there is no snapshot
 *                    request/response protocol to invent
 * Broadcast would mean hand-rolling all three.
 *
 * ponytail: the whole form travels in every presence payload (~500 bytes for
 * 13 short fields). If the form grew to hundreds of fields or long free text,
 * switch to Broadcast for field-level patches plus Presence for the snapshot.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const realtimeConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

const CHANNEL = 'agnos-intake-v1'

// No socket is opened until .channel().subscribe() runs, so a module-level
// client costs nothing on pages that never sync.
const client = realtimeConfigured
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: { persistSession: false },
      // 250ms debounce on the patient side puts us at ~4 msg/s; the cap is 10.
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null

/* ------------------------------------------------------------------ */

export type PatientStatus = 'filling' | 'idle' | 'inactive' | 'submitted' | 'disconnected'
export type Connection = 'off' | 'connecting' | 'live' | 'error'

/** Presence thresholds, measured from the last update staff received. */
export const IDLE_AFTER_MS = 10_000
export const INACTIVE_AFTER_MS = 60_000

/** What a patient tab publishes. Deliberately small and flat. */
export type PatientPresence = {
  sessionId: string
  data: Partial<PatientForm>
  submitted: boolean
  filled: number
  total: number
  startedAt: number
}

export type StaffSession = PatientPresence & {
  online: boolean
  /** Fields that changed on the last update, for the highlight flash. */
  changed: FieldName[]
  /**
   * Stamped on the *staff* clock the moment a change arrives. Presence carries
   * the patient's own timestamps, and comparing another machine's clock to ours
   * would misread clock skew as idleness — so activity is timed locally.
   */
  lastChangeAt: number
}

export function deriveStatus(session: StaffSession, now: number): PatientStatus {
  if (session.submitted) return 'submitted'
  if (!session.online) return 'disconnected'
  const since = now - session.lastChangeAt
  if (since < IDLE_AFTER_MS) return 'filling'
  if (since < INACTIVE_AFTER_MS) return 'idle'
  return 'inactive'
}

/* ------------------------------------------------------------------ *
 * Patient side
 * ------------------------------------------------------------------ */

export function usePatientPresence(sessionId: string) {
  const [connection, setConnection] = useState<Connection>(realtimeConfigured ? 'connecting' : 'off')
  const channel = useRef<RealtimeChannel | null>(null)
  const subscribed = useRef(false)
  // Whatever we last tried to send. Replayed on (re)subscribe so a reconnect
  // never leaves staff looking at a stale form.
  const latest = useRef<PatientPresence | null>(null)

  useEffect(() => {
    if (!client || !sessionId) return

    const ch = client.channel(CHANNEL, { config: { presence: { key: sessionId } } })
    channel.current = ch

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        subscribed.current = true
        setConnection('live')
        if (latest.current) void ch.track(latest.current)
        return
      }
      subscribed.current = false
      setConnection(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'error' : 'connecting')
    })

    return () => {
      subscribed.current = false
      channel.current = null
      void client.removeChannel(ch)
    }
  }, [sessionId])

  const publish = useCallback((payload: PatientPresence) => {
    latest.current = payload
    if (subscribed.current) void channel.current?.track(payload)
  }, [])

  return { publish, connection }
}

/* ------------------------------------------------------------------ *
 * Staff side
 * ------------------------------------------------------------------ */

/**
 * Folds one presence snapshot into what staff already knows. Pure and exported
 * so the only piece of logic that cannot be exercised in a browser without
 * live credentials can still be tested directly.
 *
 * ponytail: every session ever seen is kept, never pruned. A patient who
 * submits and closes the tab drops out of presence, and staff must still see
 * that submission. "Never delete" is also less code than any prune rule; the
 * list resets on reload, which is the right lifetime for a shift dashboard.
 */
export function mergePresence(
  previous: ReadonlyMap<string, StaffSession>,
  live: Record<string, PatientPresence[]>,
  now: number,
): Map<string, StaffSession> {
  const next = new Map<string, StaffSession>()
  previous.forEach((session, id) => next.set(id, { ...session, online: false }))

  for (const entries of Object.values(live)) {
    const entry = entries?.[0]
    if (!entry?.sessionId) continue // ignore anything not shaped like a patient

    // Diffed here, once per update, rather than inside every card: this is the
    // one place the new data meets the old.
    const before = next.get(entry.sessionId)
    const changed = before
      ? FIELDS.filter((f) => (before.data[f.name] ?? '') !== (entry.data[f.name] ?? '')).map((f) => f.name)
      : []
    const dirty = !before || changed.length > 0 || before.submitted !== entry.submitted

    next.set(entry.sessionId, {
      ...entry,
      online: true,
      // Presence `sync` fires whenever *anyone* changes, so an untouched
      // session must keep its own last-change data or its flash would be wiped
      // by somebody else typing.
      changed: dirty ? changed : before.changed,
      lastChangeAt: dirty ? now : before.lastChangeAt,
    })
  }

  return next
}

export function useStaffSessions() {
  const [sessions, setSessions] = useState<StaffSession[]>([])
  const [connection, setConnection] = useState<Connection>(realtimeConfigured ? 'connecting' : 'off')
  const seen = useRef<ReadonlyMap<string, StaffSession>>(new Map())

  useEffect(() => {
    if (!client) return

    // Staff subscribes without track(), so it observes presence without
    // appearing in it — no role flag to filter on.
    const ch = client.channel(CHANNEL)

    const sync = () => {
      const next = mergePresence(seen.current, ch.presenceState<PatientPresence>(), Date.now())
      seen.current = next
      setSessions([...next.values()].sort((a, b) => b.lastChangeAt - a.lastChangeAt))
    }

    ch.on('presence', { event: 'sync' }, sync).subscribe((status) => {
      if (status === 'SUBSCRIBED') return setConnection('live')
      setConnection(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'error' : 'connecting')
    })

    return () => {
      void client.removeChannel(ch)
    }
  }, [])

  return { sessions, connection }
}

/** Ticking clock so derived statuses age without anyone sending a message. */
export function useNow(intervalMs = 1000) {
  // 0 during SSR, real time from the first client render. Nothing derived from
  // `now` is in the initial HTML (the session list is still empty), so there is
  // nothing for hydration to disagree about.
  const [now, setNow] = useState(() => (typeof window === 'undefined' ? 0 : Date.now()))
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
