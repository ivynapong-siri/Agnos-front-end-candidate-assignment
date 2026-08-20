import type { Dictionary } from '@/i18n'
import { FIELDS, displayValue } from './fields'
import { deriveStatus, type StaffSession } from './realtime'

/**
 * CSV that Excel actually opens correctly, with Thai intact.
 *
 * Three things go wrong otherwise, and all three are one-liners once known:
 *   1. Excel on Windows does not sniff UTF-8, so Thai arrives as mojibake
 *      unless the file starts with a byte-order mark.
 *   2. Excel eats the leading zero off a Thai mobile — 0812345678 becomes
 *      812345678, or worse, 8.12E+08.
 *   3. Excel evaluates formulas straight out of a CSV. A patient could type
 *      =HYPERLINK(...) into the address field and have it run on a staff
 *      machine. That is a genuine injection path across a trust boundary,
 *      because the patient is an untrusted author and staff is the reader.
 */

const BOM = '﻿'

/** Leading characters Excel and Sheets treat as the start of a formula. */
const FORMULA_START = /^[=+\-@\t\r]/

/** A digit run with a meaningful leading zero — every Thai mobile number. */
const LEADING_ZERO_DIGITS = /^0\d+$/

/**
 * Wrapping a value as `="…"` makes Excel resolve it to that literal text, which
 * defuses an injected formula and preserves a leading zero in one move.
 */
export function csvCell(value: string): string {
  const text = value ?? ''
  const body =
    FORMULA_START.test(text) || LEADING_ZERO_DIGITS.test(text)
      ? `="${text.replace(/"/g, '""')}"`
      : text
  return /[",\r\n]/.test(body) ? `"${body.replace(/"/g, '""')}"` : body
}

export function toCsv(rows: readonly (readonly string[])[]): string {
  // CRLF: what Excel expects, and harmless everywhere else.
  return BOM + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

/** `2026-08-21 14:32` — sorts correctly in a spreadsheet and reads the same in
 *  every locale, unlike a localised date string (th-TH would also switch to the
 *  Buddhist era mid-file). */
export function stamp(ms: number): string {
  const date = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function buildExportRows(
  sessions: readonly StaffSession[],
  dict: Dictionary,
  now: number,
): string[][] {
  const header = [
    dict.staff.export.reference,
    ...FIELDS.map((field) => dict.form.fields[field.name].label),
    dict.staff.export.status,
    dict.staff.export.progress,
    dict.staff.export.updated,
  ]

  const rows = sessions.map((session) => [
    session.sessionId.slice(0, 8).toUpperCase(),
    ...FIELDS.map((field) => displayValue(field, (session.data[field.name] ?? '').trim(), dict)),
    dict.status[deriveStatus(session, now)].label,
    `${session.filled}/${session.total}`,
    stamp(session.lastChangeAt),
  ])

  return [header, ...rows]
}

export function exportFilename(base: string, now: number): string {
  return `${base}-${stamp(now).replace(' ', '-').replace(':', '')}.csv`
}

/** Browser-only. Uses Blob + an object URL, so there is nothing to install. */
export function downloadCsv(filename: string, rows: readonly (readonly string[])[]): void {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  // Deferred: revoking in the same tick can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
