import type { Locale } from '@/i18n'

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
 * Thai's "short" weekday is the whole word — อาทิตย์, not อา — which will not fit
 * a seven-column grid, so it falls back to "narrow". English keeps "short",
 * because narrow English gives two Ts and two Ss and reads as nonsense. The rule
 * is locale-agnostic: use short unless short is not actually short.
 */
export function weekdayNames(locale: Locale): string[] {
  // 2024-01-07 was a Sunday.
  const build = (weekday: 'short' | 'narrow') => {
    const format = formatter(locale, { weekday })
    return Array.from({ length: 7 }, (_, day) => format.format(new Date(2024, 0, 7 + day)))
  }
  const short = build('short')
  return short.some((name) => name.length > 3) ? build('narrow') : short
}

export function formatLongDate(value: string, locale: Locale): string {
  const date = fromIsoDate(value)
  if (!date) return value
  return formatter(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}
