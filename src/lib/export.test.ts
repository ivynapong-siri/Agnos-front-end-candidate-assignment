import assert from 'node:assert/strict'
import { test } from 'node:test'
import en from '../i18n/en'
import th from '../i18n/th'
import { buildExportRows, csvCell, stamp, toCsv } from './export'
import { FIELDS } from './fields'
import type { StaffSession } from './realtime'

const BOM = '﻿'

test('plain values pass through untouched', () => {
  assert.equal(csvCell('Somchai'), 'Somchai')
  assert.equal(csvCell('สมชาย ใจดี'), 'สมชาย ใจดี')
  assert.equal(csvCell(''), '')
})

test('commas, quotes and newlines are quoted and escaped', () => {
  assert.equal(csvCell('Bangkok, Thailand'), '"Bangkok, Thailand"')
  assert.equal(csvCell('say "hi"'), '"say ""hi"""')
  assert.equal(csvCell('line one\nline two'), '"line one\nline two"')
})

test('a leading zero on a Thai mobile survives Excel', () => {
  // Bare 0812345678 is read as the number 812345678 and the zero is lost.
  // ="0812345678" makes Excel resolve it to that literal text instead.
  assert.equal(csvCell('0812345678'), '"=""0812345678"""')
})

test('formula injection from a patient-typed field is defused', () => {
  // The patient is an untrusted author and staff's spreadsheet is the reader,
  // so this is a real trust boundary: Excel evaluates = cells from a CSV.
  for (const payload of ['=1+1', '=cmd|\' /c calc\'!A1', '+1+1', '-1+1', '@SUM(A1)']) {
    const cell = csvCell(payload)
    assert.ok(cell.startsWith('"="""') || cell.startsWith('"=""'), `${payload} was wrapped`)
    assert.ok(cell.includes(payload.replace(/"/g, '""')), `${payload} is preserved as text`)
  }
})

test('the file starts with a BOM and uses CRLF', () => {
  const csv = toCsv([
    ['ชื่อ', 'นามสกุล'],
    ['สมชาย', 'ใจดี'],
  ])
  // Without the BOM, Excel on Windows renders Thai as mojibake.
  assert.ok(csv.startsWith(BOM), 'starts with a byte-order mark')
  assert.equal(csv, `${BOM}ชื่อ,นามสกุล\r\nสมชาย,ใจดี\r\n`)
})

test('the timestamp sorts lexicographically', () => {
  const earlier = stamp(new Date(2026, 0, 2, 9, 5).getTime())
  const later = stamp(new Date(2026, 10, 20, 14, 32).getTime())
  assert.equal(earlier, '2026-01-02 09:05')
  assert.equal(later, '2026-11-20 14:32')
  assert.ok(earlier < later, 'string order matches time order')
})

const session: StaffSession = {
  sessionId: 'abcdef12-3456-7890-abcd-ef1234567890',
  data: {
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    gender: 'Male',
    religion: 'Buddhism',
    phone: '0812345678',
    nationality: 'ไทย',
  },
  submitted: true,
  filled: 9,
  total: 9,
  startedAt: 0,
  online: true,
  changed: [],
  lastChangeAt: new Date(2026, 7, 21, 14, 32).getTime(),
}

test('the export has one column per field plus the four meta columns', () => {
  const [header, row] = buildExportRows([session], en, session.lastChangeAt)
  assert.equal(header.length, FIELDS.length + 4)
  assert.equal(row.length, header.length)
  assert.equal(row[0], 'ABCDEF12', 'reference is the short session id')
  assert.equal(row.at(-3), 'Submitted')
  assert.equal(row.at(-2), '9/9')
  assert.equal(row.at(-1), '2026-08-21 14:32')
})

test('stored values are English but the export reads in the chosen language', () => {
  const genderColumn = 1 + FIELDS.findIndex((f) => f.name === 'gender')
  const religionColumn = 1 + FIELDS.findIndex((f) => f.name === 'religion')

  const [enHeader, enRow] = buildExportRows([session], en, session.lastChangeAt)
  const [thHeader, thRow] = buildExportRows([session], th, session.lastChangeAt)

  assert.equal(enRow[genderColumn], 'Male')
  assert.equal(thRow[genderColumn], 'ชาย')
  assert.equal(enRow[religionColumn], 'Buddhism')
  assert.equal(thRow[religionColumn], 'พุทธ')

  assert.equal(enHeader[genderColumn], 'Gender')
  assert.equal(thHeader[genderColumn], 'เพศ')
})

test('free-text nationality is exported as typed, not dropped', () => {
  const column = 1 + FIELDS.findIndex((f) => f.name === 'nationality')
  const [, row] = buildExportRows([session], en, session.lastChangeAt)
  assert.equal(row[column], 'ไทย', 'an unmatched suggestion is still the answer')
})

test('unanswered fields export as empty, not as placeholder copy', () => {
  const column = 1 + FIELDS.findIndex((f) => f.name === 'email')
  const [, row] = buildExportRows([session], en, session.lastChangeAt)
  assert.equal(row[column], '')
})
