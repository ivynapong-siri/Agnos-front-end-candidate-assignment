'use client'

import { FIELDS } from '@/lib/fields'
import type { PatientForm } from '@/lib/schema'
import { deriveStatus, type StaffSession } from '@/lib/realtime'
import { StatusBadge } from './StatusBadge'

/** How long a just-changed field stays highlighted. */
const FLASH_MS = 1400

function ago(ms: number) {
  const seconds = Math.round(ms / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

function initials(data: Partial<PatientForm>) {
  const letters = [data.firstName?.[0], data.lastName?.[0]].filter(Boolean).join('')
  return letters.toUpperCase() || '?'
}

export function SessionCard({ session, now }: { session: StaffSession; now: number }) {
  // No timer and no local state: the diff arrives with the update, and the
  // dashboard's one-second tick is what makes the highlight expire.
  const flashing = now - session.lastChangeAt < FLASH_MS ? session.changed : []
  const status = deriveStatus(session, now)
  const percent = Math.round((session.filled / session.total) * 100)

  const name = [session.data.firstName, session.data.middleName, session.data.lastName]
    .filter((part) => part && part.trim() !== '')
    .join(' ')

  return (
    <article className="animate-rise overflow-hidden rounded-3xl border border-brand-wash bg-white shadow-card transition-shadow hover:shadow-lift">
      <header className="flex items-start gap-3 p-4 sm:p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-wash font-bold text-brand">
          {initials(session.data)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-navy-900">{name || 'Unnamed patient'}</h3>
          <p className="mt-0.5 font-mono text-xs text-muted">
            {session.sessionId.slice(0, 8).toUpperCase()} · {ago(now - session.lastChangeAt)}
          </p>
        </div>
        <StatusBadge status={status} />
      </header>

      <div className="px-4 pb-4 sm:px-5">
        <div className="mb-1 flex items-baseline justify-between text-xs font-medium text-muted">
          <span>
            {session.filled} of {session.total} required
          </span>
          <span className="font-bold text-brand">{percent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-brand-wash">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              status === 'submitted' ? 'bg-state-ok' : 'bg-brand'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Native <details>: staff can collapse a card on a phone without a line
          of state management, and it is open by default so the live values show. */}
      <details open className="group border-t border-brand-wash">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted sm:px-5">
          Submitted details
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform group-open:rotate-180" fill="none" aria-hidden="true">
            <path d="M3.5 6L8 10.5 12.5 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-brand" />
          </svg>
        </summary>

        <dl className="divide-y divide-brand-wash/70 px-4 pb-3 sm:px-5">
          {FIELDS.map((field) => {
            const value = (session.data[field.name] ?? '').trim()
            return (
              <div
                key={field.name}
                className={`-mx-2 rounded-lg px-2 py-2 sm:flex sm:gap-3 ${flashing.includes(field.name) ? 'animate-flash' : ''}`}
              >
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted sm:w-2/5 sm:shrink-0 sm:normal-case sm:tracking-normal">
                  {field.label}
                </dt>
                <dd className={`min-w-0 break-words text-sm ${value ? 'text-ink' : 'text-muted/70'}`}>
                  {value || (field.required ? 'Not answered yet' : '—')}
                </dd>
              </div>
            )
          })}
        </dl>
      </details>
    </article>
  )
}
