'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import { FIELDS, type FieldName } from './fields'
import type { PatientForm } from './schema'

/**
 * Transport: Supabase Realtime on a single shared channel, using **Broadcast for
 * the form and Presence for the roster**.
 *
 * Presence alone was the original design, and it was wrong. Supabase caps
 * presence updates at **six per channel join** — measured against production at
 * four different rates, all of which died on the sixth `track()`, from 500ms
 * apart to 6s apart:
 *
 *     {"message":"Client presence rate limit exceeded"} -> phx_close
 *
 * It is a quota, not a rate, so no amount of debouncing survives it: a patient
 * got about six edits in before the channel closed for good. Worse, the socket
 * stays open when the channel closes, so supabase-js never reconnected and the
 * form was disconnected for the rest of its life while still showing
 * "connecting".
 *
 * So the two jobs are split by what each primitive is actually good at:
 *   - Broadcast  every edit. Measured at 4 msg/s for 34s: 136 sent, 136
 *                delivered, no error. This is the normal messaging primitive and
 *                the one the 10 events/second client throttle below is for.
 *   - Presence   one `track({ sessionId })` per join, identity only. Kept purely
 *                because it is the only thing that reports a patient *leaving* —
 *                closing the tab removes the entry with no heartbeat to write.
 *
 * What that split costs, and how it is paid: broadcasts are not retained, so
 * staff opening the dashboard mid-form has missed everything. On subscribe it
 * broadcasts a `sync` request and every patient answers with its current form.
 * That is the request/response protocol presence used to make unnecessary — 20
 * lines, and the price of a transport that does not die on the sixth keystroke.
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

/** Form edits. Broadcast, not presence — see the note at the top of the file. */
const FORM_EVENT = 'form'
/** Staff asking whoever is mid-form to resend, so a late join sees the board. */
const SYNC_EVENT = 'sync'
/** How long to wait before rejoining a channel the server closed. */
const REJOIN_DELAY_MS = 1500

export function usePatientPresence(sessionId: string) {
  const [connection, setConnection] = useState<Connection>(realtimeConfigured ? 'connecting' : 'off')
  const channel = useRef<RealtimeChannel | null>(null)
  const subscribed = useRef(false)
  /** Removal of the previous channel, awaited before the next one joins. */
  const teardown = useRef<Promise<unknown>>(Promise.resolve())
  // Whatever we last tried to send. Resent on (re)subscribe, and whenever staff
  // asks, so neither a reconnect nor a late-opening dashboard leaves the front
  // desk looking at a stale form.
  const latest = useRef<PatientPresence | null>(null)

  useEffect(() => {
    if (!client || !sessionId) return
    const active = client
    let disposed = false
    let retry: ReturnType<typeof setTimeout> | undefined

    const join = () => {
      if (disposed) return
      const ch = active.channel(currentChannel(), { config: { presence: { key: sessionId } } })
      channel.current = ch

      // Guards the rejoin against itself: removeChannel() fires the subscribe
      // callback with CLOSED again, which would otherwise schedule a second
      // rejoin for every one that ran.
      let closing = false
      const rejoin = () => {
        if (disposed || closing) return
        closing = true
        subscribed.current = false
        void active.removeChannel(ch)
        retry = setTimeout(join, REJOIN_DELAY_MS)
      }

      const sendLatest = () => {
        if (latest.current) void ch.send({ type: 'broadcast', event: FORM_EVENT, payload: latest.current })
      }

      // Staff opening the dashboard mid-form has missed every edit so far.
      ch.on('broadcast', { event: SYNC_EVENT }, sendLatest)

      ch.subscribe((status) => {
        if (disposed || closing) return
        if (status === 'SUBSCRIBED') {
          subscribed.current = true
          setConnection('live')
          // Exactly one track() per join, carrying identity and nothing else.
          // Presence is only the roster now: it says who is here and tells staff
          // the moment they leave. The form itself travels by broadcast.
          void ch.track({ sessionId })
          sendLatest()
          return
        }
        subscribed.current = false
        if (status === 'CLOSED') {
          // Reported as connecting because that is now true — a rejoin is
          // scheduled. Before this existed the channel simply stayed dead and
          // the patient was shown "connecting" forever.
          setConnection('connecting')
          rejoin()
          return
        }
        setConnection(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'error' : 'connecting')
      })

      return ch
    }

    // Wait for the previous channel to be gone before joining the same topic.
    //
    // This effect re-runs whenever the session id changes, which is what
    // "start another form" does. Joining immediately meant two channels on one
    // topic over one socket while the first was still unsubscribing, and the
    // server answers a duplicate join by tearing the topic down. The tab then
    // held a channel that reported SUBSCRIBED and delivered nothing: the
    // patient saw "connected", and the front desk never saw them at all.
    //
    // Caught by listening to the room directly — after "start another", three
    // keystrokes produced no broadcast and no presence entry.
    void teardown.current.then(join, join)

    // A tab that is closed outright runs no cleanup at all, so the server has
    // to notice the socket died — which is slow. pagehide fires early enough to
    // get an untrack out first.
    const leave = () => {
      void channel.current?.untrack()
    }
    window.addEventListener('pagehide', leave)

    return () => {
      disposed = true
      subscribed.current = false
      clearTimeout(retry)
      window.removeEventListener('pagehide', leave)
      const ch = channel.current
      channel.current = null
      if (!ch) return
      // untrack() before unsubscribing: it pushes a presence diff immediately,
      // so staff sees the patient leave within a beat. removeChannel alone only
      // unsubscribes this client and leaves the server to work it out.
      //
      // Held on a ref so the *next* run of this effect can wait for it. Never
      // rejects, or a failed teardown would strand every later join.
      teardown.current = ch
        .untrack()
        .then(() => active.removeChannel(ch))
        .catch(() => undefined)
    }
  }, [sessionId])

  const publish = useCallback((payload: PatientPresence) => {
    latest.current = payload
    if (subscribed.current) {
      void channel.current?.send({ type: 'broadcast', event: FORM_EVENT, payload })
    }
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
  /**
   * The latest form each patient has broadcast. Presence used to hold this, and
   * `mergePresence` still takes the same shape — the data just arrives by a
   * different road now, so all of its behaviour and its tests are untouched.
   */
  const live = useRef<Map<string, PatientPresence>>(new Map())

  useEffect(() => {
    if (!client) return
    const active = client
    let disposed = false
    let retry: ReturnType<typeof setTimeout> | undefined

    // Held so teardown removes the channel that is actually open. client.channel()
    // does not return an existing channel for a topic, it makes another one, so
    // removeChannel(client.channel(topic)) would have swept up a fresh instance
    // and left the live one running.
    let current: RealtimeChannel | null = null

    const publish = (next: ReadonlyMap<string, StaffSession>) => {
      seen.current = next
      setSessions([...next.values()].sort((a, b) => b.lastChangeAt - a.lastChangeAt))
    }

    const recompute = () => {
      const record: Record<string, PatientPresence[]> = {}
      live.current.forEach((patient, id) => {
        record[id] = [patient]
      })
      const next = mergePresence(seen.current, record, Date.now())
      publish(next)

      // One timer for the whole board, not one per card. Fires after the exit
      // animation and sweeps whatever is still marked as leaving.
      if ([...next.values()].some((session) => session.leavingAt !== undefined)) {
        clearTimeout(exitTimer.current)
        exitTimer.current = setTimeout(() => publish(pruneDeparted(seen.current, Date.now())), EXIT_MS + 20)
      }
    }

    const join = () => {
      if (disposed) return
      // Staff subscribes without track(), so it observes presence without
      // appearing in it — no role flag to filter on.
      const ch = active.channel(currentChannel())
      current = ch

      let closing = false
      const rejoin = () => {
        if (disposed || closing) return
        closing = true
        void active.removeChannel(ch)
        retry = setTimeout(join, REJOIN_DELAY_MS)
      }

      ch.on('broadcast', { event: FORM_EVENT }, ({ payload }) => {
        const patient = payload as PatientPresence
        if (!patient?.sessionId) return // ignore anything not shaped like a patient
        live.current.set(patient.sessionId, patient)
        recompute()
      })

      // Presence is the roster: it is what says a patient has gone, which is the
      // one thing broadcast cannot tell us. Dropping them here is what lets
      // mergePresence stamp the card for its exit animation.
      ch.on('presence', { event: 'sync' }, () => {
        const online = new Set(Object.keys(ch.presenceState()))
        for (const id of [...live.current.keys()]) {
          if (!online.has(id)) live.current.delete(id)
        }
        recompute()
      })

      ch.subscribe((status) => {
        if (disposed || closing) return
        if (status === 'SUBSCRIBED') {
          setConnection('live')
          // Every edit so far went out as a broadcast, which is not retained, so
          // opening this page mid-form would otherwise show an empty board.
          void ch.send({ type: 'broadcast', event: SYNC_EVENT, payload: {} })
          return
        }
        if (status === 'CLOSED') {
          setConnection('connecting')
          rejoin()
          return
        }
        setConnection(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'error' : 'connecting')
      })
    }

    join()

    return () => {
      disposed = true
      clearTimeout(exitTimer.current)
      clearTimeout(retry)
      if (current) void active.removeChannel(current)
      current = null
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
