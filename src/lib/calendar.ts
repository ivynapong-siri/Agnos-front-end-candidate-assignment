import type { Dictionary, Locale } from '@/i18n'

/** A local calendar date as `YYYY-MM-DD`, which is what <input type="date"> means
 *  and what the schema validates. Never built via toISOString(), which would
 *  shift the day by one in every timezone east of UTC. */
export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromIsoDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export type DayCell = { date: Date; iso: string; inMonth: boolean }

/**
 * Six weeks of cells starting on the Sunday on or before the 1st, including the
 * adjacent months' days so the grid never reflows between months. Pure, so the
 * awkward cases — leap years, months that start on a Sunday — are testable.
 */
export function monthGrid(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    return { date, iso: toIsoDate(date), inMonth: date.getMonth() === month }
  })
}

/**
 * Forced to the Gregorian calendar. `th-TH` defaults to the Buddhist era, which
 * would show a patient born in 1990 the year 2533 while the stored value stayed
 * 1990 — two different numbers for the same birthday.
 */
function formatter(locale: Locale, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(`${locale}-u-ca-gregory`, options)
}

export function monthNames(locale: Locale): string[] {
  const format = formatter(locale, { month: 'long' })
  return Array.from({ length: 12 }, (_, month) => format.format(new Date(2000, month, 1)))
}

/**
 * Sunday-first, matching the grid.
 *
 * These come from the dictionary rather than Intl on purpose. Deriving them at
 * runtime made the output depend on which engine rendered: Node returns Thai
 * "short" as "อา." while Chrome returns "อาทิตย์", so a heuristic picking
 * between short and narrow chose differently on the server and the client, and
 * hydration failed on the text. Seven strings per language is a small price for
 * the same grid everywhere.
 */
export function weekdayNames(dict: Dictionary): string[] {
  return dict.picker.weekdays
}

export function formatLongDate(value: string, locale: Locale): string {
  const date = fromIsoDate(value)
  if (!date) return value
  return formatter(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}
