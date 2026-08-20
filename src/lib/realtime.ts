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

/**
 * Everyone on a deployment shares one channel, which is right for one clinic's
 * front desk and wrong for a public demo — two strangers trying the link would
 * watch each other type their name in. `?room=<name>` on either page opts into
 * a private channel. Omitted, behaviour is unchanged.
 *
 * The room comes from the URL, so it is untrusted input: capped and stripped to
 * word characters before it becomes a channel name.
 */
export function channelFor(search: string): string {
  const room = new URLSearchParams(search).get('room')?.trim().replace(/[^\w-]/g, '')
  return room ? `${CHANNEL}--${room.slice(0, 40)}` : CHANNEL
}

const ROOM_KEY = 'agnos.room'

/**
 * Resolves the room from the URL, then remembers it for the tab. Navigating
 * within the app therefore keeps the room without every link having to carry
 * the query string — which also means no component needs useSearchParams, a
 * hook that cannot be prerendered.
 */
function currentChannel(): string {
  const fromUrl = channelFor(window.location.search)
  if (fromUrl !== CHANNEL) {
    sessionStorage.setItem(ROOM_KEY, fromUrl)
    return fromUrl
  }
  return sessionStorage.getItem(ROOM_KEY) ?? CHANNEL
}

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

/** How long a departing card is kept around so it can animate out. */
export const EXIT_MS = 320

export type StaffSession = PatientPresence & {
  online: boolean
  /**
   * When this session vanished from presence, on the staff clock. Set instead of
   * deleting the row outright, so the card has time to animate away; pruned by
   * pruneDeparted once the animation is done.
   */
  leavingAt?: number
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

    const ch = client.channel(currentChannel(), { config: { presence: { key: sessionId } } })
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

    // A tab that is closed outright runs no cleanup at all, so the server has
    // to notice the socket died — which is slow. pagehide fires early enough to
    // get an untrack out first.
    const leave = () => {
      void ch.untrack()
    }
    window.addEventListener('pagehide', leave)

    return () => {
      subscribed.current = false
      channel.current = null
      window.removeEventListener('pagehide', leave)
      // untrack() before unsubscribing: it pushes a presence diff immediately,
      // so staff sees the patient leave within a beat. removeChannel alone only
      // unsubscribes this client and leaves the server to work it out.
      void ch.untrack().finally(() => {
        void client.removeChannel(ch)
      })
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
 * A patient who leaves without submitting is on their way off the board: the row
 * is stamped `leavingAt` rather than deleted, so the card can animate out, and
 * pruneDeparted removes it once the animation has run.
 *
 * A patient who *submitted* and then closed the tab is the exception and stays.
 * That row is the completed intake — the thing staff most needs to keep — and
 * its badge reads "submitted", so it presents as a record rather than a stale
 * live session.
 */
export function mergePresence(
  previous: ReadonlyMap<string, StaffSession>,
  live: Record<string, PatientPresence[]>,
  now: number,
): Map<string, StaffSession> {
  const next = new Map<string, StaffSession>()
  previous.forEach((session, id) =>
    next.set(id, {
      ...session,
      online: false,
      leavingAt: session.submitted ? undefined : (session.leavingAt ?? now),
    }),
  )

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
      // Back on the channel: cancel any pending departure rather than leaving a
      // stamp behind that would prune a live patient mid-form.
      leavingAt: undefined,
      // Presence `sync` fires whenever *anyone* changes, so an untouched
      // session must keep its own last-change data or its flash would be wiped
      // by somebody else typing.
      changed: dirty ? changed : before.changed,
      lastChangeAt: dirty ? now : before.lastChangeAt,
    })
  }

  return next
}

/** Drops rows whose exit animation has finished. Pure, for the same reason. */
export function pruneDeparted(
  sessions: ReadonlyMap<string, StaffSession>,
  now: number,
): Map<string, StaffSession> {
  const next = new Map(sessions)
  for (const [id, session] of next) {
    if (session.leavingAt !== undefined && now - session.leavingAt >= EXIT_MS) next.delete(id)
  }
  return next
}

export function useStaffSessions() {
  const [sessions, setSessions] = useState<StaffSession[]>([])
  const [connection, setConnection] = useState<Connection>(realtimeConfigured ? 'connecting' : 'off')
  const seen = useRef<ReadonlyMap<string, StaffSession>>(new Map())
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!client) return

    // Staff subscribes without track(), so it observes presence without
    // appearing in it — no role flag to filter on.
    const ch = client.channel(currentChannel())

    const publish = (next: ReadonlyMap<string, StaffSession>) => {
      seen.current = next
      setSessions([...next.values()].sort((a, b) => b.lastChangeAt - a.lastChangeAt))
    }

    const sync = () => {
      const next = mergePresence(seen.current, ch.presenceState<PatientPresence>(), Date.now())
      publish(next)

      // One timer for the whole board, not one per card. Fires after the exit
      // animation and sweeps whatever is still marked as leaving.
      if ([...next.values()].some((session) => session.leavingAt !== undefined)) {
        clearTimeout(exitTimer.current)
        exitTimer.current = setTimeout(() => publish(pruneDeparted(seen.current, Date.now())), EXIT_MS + 20)
      }
    }

    ch.on('presence', { event: 'sync' }, sync).subscribe((status) => {
      if (status === 'SUBSCRIBED') return setConnection('live')
      setConnection(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'error' : 'connecting')
    })

    return () => {
      clearTimeout(exitTimer.current)
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
