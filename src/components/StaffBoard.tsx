'use client'

import { useState } from 'react'
import { ArtWaiting } from './ArtWaiting'
import { LiveIndicator, SetupNotice } from './LiveIndicator'
import { StaffIdentity } from './StaffIdentity'
import { GlassButton } from './GlassButton'
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

  return (
    <>
      {!realtimeConfigured && <SetupNotice dict={dict} locale={locale} />}

      <div className="sticky top-16 z-20 -mx-4 mb-6 border-b border-brand-wash bg-paper/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:top-20 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="mr-auto">
            <h1 className="text-xl font-bold text-navy-900 sm:text-2xl">{dict.staff.title}</h1>
            <p className="text-sm text-muted">
              {identified.length === 0
                ? dict.staff.none
                : plural({ one: dict.staff.count_one, other: dict.staff.count_other }, identified.length)}
            </p>
          </div>
          <StaffIdentity dict={dict} locale={locale} />
          <LiveIndicator connection={connection} dict={dict} />
          <GlassButton
            tone="secondary"
            size="sm"
            type="button"
            onClick={exportVisible}
            disabled={visible.length === 0}
            title={visible.length === 0 ? dict.staff.export.nothing : undefined}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {dict.staff.export.button}
          </GlassButton>
          <GlassButton
            size="sm"
            href={`/${locale}/patient`}
            external
            // target=_blank with rel=noreferrer gives the new tab a clean
            // sessionStorage, so the remembered room would be lost. Rewriting
            // the href on the way out carries it, without needing
            // useSearchParams (which cannot be prerendered).
            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
              event.currentTarget.href = `/${locale}/patient${window.location.search}`
            }}
            target="_blank"
            rel="noreferrer"
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {dict.staff.openForm}
          </GlassButton>
        </div>

        {/* Counters double as filters — one control instead of a legend plus a dropdown. */}
        {counts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <GlassButton
              tone={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              type="button"
              onClick={() => setFilter('all')}
              className="text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {dict.staff.all} {decorated.length}
            </GlassButton>
            {counts.map(({ status, count }) => (
              <GlassButton
                key={status}
                tone={filter === status ? 'primary' : 'ghost'}
                size="sm"
                type="button"
                onClick={() => setFilter(status)}
                title={statusTitle(dict, status)}
                className="text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_STYLE[status].dot}`} />
                {dict.status[status].short} {count}
              </GlassButton>
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
          <GlassButton tone="secondary" size="sm" type="button" onClick={() => setFilter('all')} className="mt-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            {dict.staff.showAll}
          </GlassButton>
        </div>
      ) : (
        // data-clarity-mask: this list is every patient's name, phone number and
        // address as plain page text, which a session replay would otherwise
        // record verbatim.
        <div className="grid" data-clarity-mask="true">
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
                <SessionCard session={session} now={now} dict={dict} locale={locale} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
