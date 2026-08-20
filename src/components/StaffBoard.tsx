'use client'

import { useState } from 'react'
import { ArtWaiting } from './Art'
import { LiveIndicator, SetupNotice } from './LiveIndicator'
import { SessionCard } from './SessionCard'
import { STATUS_ORDER, STATUS_STYLE, statusTitle } from './StatusBadge'
import { fill, plural, type Dictionary, type Locale } from '@/i18n'
import { buildExportRows, downloadCsv, exportFilename } from '@/lib/export'
import {
  EXIT_MS,
  deriveStatus,
  realtimeConfigured,
  useNow,
  useStaffSessions,
  type PatientStatus,
} from '@/lib/realtime'

type Filter = PatientStatus | 'all'

export function StaffBoard({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const { sessions, connection } = useStaffSessions()
  // Statuses age on a local tick, so a patient going quiet moves from "filling"
  // to "paused" to "inactive" with no message being sent at all.
  const now = useNow(1000)
  const [filter, setFilter] = useState<Filter>('all')

  // Bug fix: a session with no name at all is somebody who opened the page and
  // typed nothing identifying. Staff cannot act on it, so it is not a patient
  // yet — and an "unnamed" card is pure noise on the board. Filtered here at the
  // source, so the count, the chips, the cards and the export all agree.
  const identified = sessions.filter(
    (session) => `${session.data.firstName ?? ''}${session.data.lastName ?? ''}`.trim() !== '',
  )

  const decorated = identified.map((session) => ({ session, status: deriveStatus(session, now) }))
  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: decorated.filter((entry) => entry.status === status).length,
  })).filter((entry) => entry.count > 0)

  const visible = filter === 'all' ? decorated : decorated.filter((entry) => entry.status === filter)

  // Exports whatever the filter is currently showing, so "submitted only" needs
  // no second control — the filter chips already say what to include.
  const exportVisible = () => {
    const rows = buildExportRows(
      visible.map((entry) => entry.session),
      dict,
      now,
    )
    downloadCsv(exportFilename(dict.staff.export.filename, now), rows)
  }

  const chip = (active: boolean) =>
    `min-h-11 rounded-full px-3.5 text-xs font-semibold transition-colors ${
      active ? 'bg-navy-900 text-white' : 'bg-white text-ink/70 ring-1 ring-brand-wash hover:ring-brand-tint'
    }`

  return (
    <>
      {!realtimeConfigured && <SetupNotice dict={dict} locale={locale} />}

      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-brand-wash bg-paper/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="mr-auto">
            <h1 className="text-xl font-bold text-navy-900 sm:text-2xl">{dict.staff.title}</h1>
            <p className="text-sm text-muted">
              {identified.length === 0
                ? dict.staff.none
                : plural({ one: dict.staff.count_one, other: dict.staff.count_other }, identified.length)}
            </p>
          </div>
          <LiveIndicator connection={connection} dict={dict} />
          <button
            type="button"
            onClick={exportVisible}
            disabled={visible.length === 0}
            title={visible.length === 0 ? dict.staff.export.nothing : undefined}
            className="min-h-11 rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand ring-1 ring-brand-wash transition-colors hover:ring-brand-tint disabled:opacity-50 disabled:hover:ring-brand-wash"
          >
            {dict.staff.export.button}
          </button>
          <a
            href={`/${locale}/patient`}
            // target=_blank with rel=noreferrer gives the new tab a clean
            // sessionStorage, so the remembered room would be lost. Rewriting
            // the href on the way out carries it, without needing
            // useSearchParams (which cannot be prerendered).
            onClick={(event) => {
              event.currentTarget.href = `/${locale}/patient${window.location.search}`
            }}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy-900"
          >
            {dict.staff.openForm}
          </a>
        </div>

        {/* Counters double as filters — one control instead of a legend plus a dropdown. */}
        {counts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilter('all')} className={chip(filter === 'all')}>
              {dict.staff.all} {decorated.length}
            </button>
            {counts.map(({ status, count }) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                title={statusTitle(dict, status)}
                className={chip(filter === status)}
              >
                <span
                  className={`mr-1.5 inline-block h-2 w-2 rounded-full align-middle ${STATUS_STYLE[status].dot}`}
                />
                {dict.status[status].short} {count}
              </button>
            ))}
          </div>
        )}
      </div>

      {identified.length === 0 ? (
        <div className="rounded-3xl border border-brand-wash bg-white p-8 text-center shadow-card sm:p-14">
          <ArtWaiting className="mx-auto h-32 w-48 animate-float" />
          <h2 className="mt-4 text-lg font-bold text-navy-900">{dict.staff.emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{dict.staff.emptyBody}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-brand-wash bg-white p-8 text-center shadow-card">
          <p className="text-sm text-muted">
            {fill(dict.staff.noneWithStatus, { status: dict.status[filter as PatientStatus].label })}
          </p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="mt-3 text-sm font-semibold text-brand underline underline-offset-4"
          >
            {dict.staff.showAll}
          </button>
        </div>
      ) : (
        <div className="grid">
          {/* No gap on the container: the spacing lives inside each collapsing
              wrapper, so a departing card takes its own gap with it instead of
              leaving a hole behind while it animates. */}
          {visible.map(({ session }) => (
            <div
              key={session.sessionId}
              style={{ transitionDuration: `${EXIT_MS}ms` }}
              className={`grid transition-all ease-in-out ${
                session.leavingAt === undefined
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'scale-[0.98] grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="min-h-0 overflow-hidden pb-5">
                <SessionCard session={session} now={now} dict={dict} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
