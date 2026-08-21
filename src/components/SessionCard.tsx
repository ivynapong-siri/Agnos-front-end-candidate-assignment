'use client'

import { fill, type Dictionary, type Locale } from '@/i18n'
import { FIELDS, displayValue } from '@/lib/fields'
import type { PatientForm } from '@/lib/schema'
import { deriveStatus, type StaffSession } from '@/lib/realtime'
import { StatusBadge } from './StatusBadge'

/** How long a just-changed field stays highlighted. */
const FLASH_MS = 1400

function ago(ms: number, dict: Dictionary) {
  const seconds = Math.round(ms / 1000)
  if (seconds < 5) return dict.time.justNow
  if (seconds < 60) return fill(dict.time.seconds, { n: seconds })
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return fill(dict.time.minutes, { n: minutes })
  return fill(dict.time.hours, { n: Math.floor(minutes / 60) })
}

function initials(data: Partial<PatientForm>) {
  const letters = [data.firstName?.[0], data.lastName?.[0]].filter(Boolean).join('')
  return letters.toUpperCase() || '?'
}

export function SessionCard({
  session,
  now,
  dict,
  locale,
}: {
  session: StaffSession
  now: number
  dict: Dictionary
  locale: Locale
}) {
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
          <h3 className="truncate font-bold text-navy-900">{name}</h3>
          <p className="mt-0.5 text-xs text-muted">
            <span className="font-mono">{session.sessionId.slice(0, 8).toUpperCase()}</span> ·{' '}
            {ago(now - session.lastChangeAt, dict)}
          </p>
        </div>
        <StatusBadge status={status} dict={dict} />
      </header>

      <div className="px-4 pb-4 sm:px-5">
        <div className="mb-1 flex items-baseline justify-between gap-3 text-xs font-medium text-muted">
          <span>{fill(dict.staff.ofRequired, { filled: session.filled, total: session.total })}</span>
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

      {/*
        Native <details>, closed by default. Thirteen rows per card is fine for
        three patients and unreadable for a hundred — a busy morning turns the
        board into a page nobody can scan. Collapsed, every card is a fixed
        four lines: who, how far, what state, how long ago. That is what triage
        needs; the detail is one click away when a particular patient matters.

        The trade is that the change-flash only plays while a card is open. The
        header still moves — progress, status and "last change" all update — so
        activity is never invisible, only quieter.
      */}
      <details className="group border-t border-brand-wash">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-xs font-semibold text-muted sm:px-5">
          {dict.staff.details}
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3.5 6L8 10.5 12.5 6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-brand"
            />
          </svg>
        </summary>

        <dl className="divide-y divide-brand-wash/70 px-4 pb-3 sm:px-5">
          {FIELDS.map((field) => {
            const raw = (session.data[field.name] ?? '').trim()
            return (
              <div
                key={field.name}
                className={`-mx-2 rounded-lg px-2 py-2 sm:flex sm:gap-3 ${
                  flashing.includes(field.name) ? 'animate-flash' : ''
                }`}
              >
                <dt className="text-xs font-semibold text-muted sm:w-2/5 sm:shrink-0">
                  {dict.form.fields[field.name].label}
                </dt>
                <dd className={`min-w-0 break-words text-sm ${raw ? 'text-ink' : 'text-muted'}`}>
                  {raw ? displayValue(field, raw, dict, locale) : field.required ? dict.staff.notAnswered : '—'}
                </dd>
              </div>
            )
          })}
        </dl>
      </details>
    </article>
  )
}
