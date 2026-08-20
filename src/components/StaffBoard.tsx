'use client'

import { useState } from 'react'
import { ArtWaiting } from './Art'
import { LiveIndicator, SetupNotice } from './LiveIndicator'
import { SessionCard } from './SessionCard'
import { STATUS, STATUS_ORDER } from './StatusBadge'
import { deriveStatus, realtimeConfigured, useNow, useStaffSessions, type PatientStatus } from '@/lib/realtime'

type Filter = PatientStatus | 'all'

export function StaffBoard() {
  const { sessions, connection } = useStaffSessions()
  // Statuses age on a local tick, so a patient going quiet moves from "filling"
  // to "paused" to "inactive" with no message being sent at all.
  const now = useNow(1000)
  const [filter, setFilter] = useState<Filter>('all')

  const decorated = sessions.map((session) => ({ session, status: deriveStatus(session, now) }))
  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: decorated.filter((entry) => entry.status === status).length,
  })).filter((entry) => entry.count > 0)

  const visible = filter === 'all' ? decorated : decorated.filter((entry) => entry.status === filter)

  const chip = (active: boolean) =>
    `min-h-9 rounded-full px-3.5 text-xs font-semibold transition-colors ${
      active ? 'bg-navy-900 text-white' : 'bg-white text-ink/70 ring-1 ring-brand-wash hover:ring-brand-tint'
    }`

  return (
    <>
      {!realtimeConfigured && <SetupNotice />}

      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-brand-wash bg-paper/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="mr-auto">
            <h1 className="text-xl font-bold text-navy-900 sm:text-2xl">Front desk</h1>
            <p className="text-sm text-muted">
              {sessions.length === 0
                ? 'No patients yet'
                : `${sessions.length} patient${sessions.length === 1 ? '' : 's'} this session`}
            </p>
          </div>
          <LiveIndicator connection={connection} />
          <a
            href="/patient"
            target="_blank"
            rel="noreferrer"
            className="min-h-9 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy-900"
          >
            Open a patient form ↗
          </a>
        </div>

        {/* Counters double as filters — one control instead of a legend plus a dropdown. */}
        {counts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilter('all')} className={chip(filter === 'all')}>
              All {decorated.length}
            </button>
            {counts.map(({ status, count }) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                title={STATUS[status].title}
                className={chip(filter === status)}
              >
                <span className={`mr-1.5 inline-block h-2 w-2 rounded-full align-middle ${STATUS[status].dot}`} />
                {STATUS[status].short} {count}
              </button>
            ))}
          </div>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-3xl border border-brand-wash bg-white p-8 text-center shadow-card sm:p-14">
          <ArtWaiting className="mx-auto h-32 w-48 animate-float" />
          <h2 className="mt-4 text-lg font-bold text-navy-900">Waiting for the first patient</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            Every keystroke on a patient form appears here within a quarter of a second. Open a form in another tab or on
            your phone to watch it fill in live.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-brand-wash bg-white p-8 text-center shadow-card">
          <p className="text-sm text-muted">
            No patients are {STATUS[filter as PatientStatus].label.toLowerCase()} right now.
          </p>
          <button type="button" onClick={() => setFilter('all')} className="mt-3 text-sm font-semibold text-brand underline underline-offset-4">
            Show everyone
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ session }) => (
            <SessionCard key={session.sessionId} session={session} now={now} />
          ))}
        </div>
      )}
    </>
  )
}
