import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatLongDate, fromIsoDate, monthGrid, monthNames, toIsoDate, weekdayNames } from './calendar'
import { COUNTRIES, composePhone, flagFor, parsePhone } from './phone'

/**
 * The custom date and phone controls replaced native ones, which means their
 * awkward parts — leap years, trunk prefixes, dial codes that are prefixes of
 * each other — are now this codebase's problem rather than the browser's.
 */

/* ------------------------------------------------------------------ *
 * Calendar
 * ------------------------------------------------------------------ */

test('the grid is always six weeks and always starts on a Sunday', () => {
  for (const [year, month] of [
    [2026, 7],
    [2024, 1], // leap February
    [2026, 1], // February starting mid-week
    [2027, 7], // a month that starts on a Sunday
  ]) {
    const grid = monthGrid(year, month)
    assert.equal(grid.length, 42, `${year}-${month} has six weeks`)
    assert.equal(grid[0].date.getDay(), 0, `${year}-${month} starts on a Sunday`)
    // A fixed cell count is what stops the panel resizing between months.
    assert.equal(grid.at(-1)?.date.getDay(), 6)
  }
})

test('the grid marks which cells belong to the month on show', () => {
  const february2024 = monthGrid(2024, 1).filter((cell) => cell.inMonth)
  assert.equal(february2024.length, 29, 'leap year February has 29 days')
  assert.equal(february2024[0].iso, '2024-02-01')
  assert.equal(february2024.at(-1)?.iso, '2024-02-29')

  const february2026 = monthGrid(2026, 1).filter((cell) => cell.inMonth)
  assert.equal(february2026.length, 28, 'non-leap February has 28')
})

test('the grid includes the neighbouring months so there are no gaps', () => {
  const grid = monthGrid(2026, 7) // August 2026 starts on a Saturday
  assert.equal(grid.filter((cell) => !cell.inMonth).length, 42 - 31)
  assert.equal(grid[0].iso, '2026-07-26', 'leads in with late July')
})

test('iso dates round-trip without drifting a day', () => {
  // toISOString() would shift these back a day in any timezone east of UTC.
  for (const iso of ['1990-04-12', '2024-02-29', '2026-01-01', '2026-12-31']) {
    assert.equal(toIsoDate(fromIsoDate(iso)!), iso)
  }
  assert.equal(fromIsoDate('not-a-date'), undefined)
  assert.equal(fromIsoDate('2026-1-1'), undefined, 'a loose format is rejected, not guessed')
})

test('month and weekday names come out localised and grid-sized', () => {
  assert.equal(monthNames('en').length, 12)
  assert.equal(monthNames('en')[0], 'January')
  assert.equal(monthNames('th')[0], 'มกราคม')

  for (const locale of ['en', 'th'] as const) {
    const days = weekdayNames(locale)
    assert.equal(days.length, 7)
    // The whole point of the narrow fallback: Thai "short" is อาทิตย์, which
    // would blow out a seven-column grid.
    assert.ok(
      days.every((day) => day.length <= 3),
      `${locale} weekday labels fit a column: ${days.join(',')}`,
    )
  }
})

test('dates are shown in the Gregorian calendar even in Thai', () => {
  // th-TH defaults to the Buddhist era, which would show 2533 for a patient
  // born in 1990 while the stored value stayed 1990.
  assert.match(formatLongDate('1990-04-12', 'th'), /1990/)
  assert.doesNotMatch(formatLongDate('1990-04-12', 'th'), /2533/)
  assert.match(formatLongDate('1990-04-12', 'en'), /1990/)
})

/* ------------------------------------------------------------------ *
 * Phone
 * ------------------------------------------------------------------ */

test('a bare national number is assumed to be Thai', () => {
  assert.deepEqual(parsePhone('0812345678'), { iso2: 'TH', national: '0812345678' })
  assert.deepEqual(parsePhone(''), { iso2: 'TH', national: '' })
})

test('dial codes that are prefixes of each other resolve to the longest match', () => {
  // +65, +66 and +673 all begin with +6; list order must not decide.
  assert.equal(parsePhone('+673 1234567').iso2, 'BN')
  assert.equal(parsePhone('+66 812345678').iso2, 'TH')
  assert.equal(parsePhone('+65 91234567').iso2, 'SG')
  assert.equal(parsePhone('+1 5551234567').iso2, 'US')
})

test('an unrecognised dial code falls back rather than dropping the number', () => {
  const parsed = parsePhone('+999 123456')
  assert.equal(parsed.iso2, 'TH')
  assert.equal(parsed.national, '+999 123456', 'the number the patient typed is kept')
})

test('composing drops the trunk zero', () => {
  // A Thai patient writes 081..., and "+66 081..." is not a dialable number.
  assert.equal(composePhone('TH', '0812345678'), '+66 812345678')
  assert.equal(composePhone('TH', '812345678'), '+66 812345678')
  assert.equal(composePhone('GB', '07700900123'), '+44 7700900123')
})

test('composing an empty number yields empty, not a lone dial code', () => {
  // Otherwise an untouched field would arrive at validation as "+66".
  assert.equal(composePhone('TH', ''), '')
  assert.equal(composePhone('TH', '  '), '')
  assert.equal(composePhone('TH', '0'), '')
})

test('parse and compose round-trip', () => {
  for (const value of ['+66 812345678', '+81 9012345678', '+1 5551234567']) {
    const { iso2, national } = parsePhone(value)
    assert.equal(composePhone(iso2, national), value)
  }
})

test('every country has a distinct code and a renderable flag', () => {
  const codes = COUNTRIES.map((country) => country.iso2)
  assert.deepEqual([...new Set(codes)], codes, 'no duplicate countries')
  for (const country of COUNTRIES) {
    assert.match(country.dial, /^\+\d{1,4}$/, `${country.iso2} has a plausible dial code`)
    // Two regional-indicator code points, so it renders as a flag not letters.
    assert.equal([...flagFor(country.iso2)].length, 2, `${country.iso2} flag`)
  }
})
