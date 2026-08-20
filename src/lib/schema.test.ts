import assert from 'node:assert/strict'
import { test } from 'node:test'
import { makePatientSchema } from './schema'
import { EMPTY_FORM, countFilled } from './fields'
import { deriveStatus, type StaffSession } from './realtime'
import en from '../i18n/en'

// Asserted against the English messages; th.ts is checked for shape parity in
// i18n.test.ts, so a missing Thai message cannot slip through either.
const patientSchema = makePatientSchema(en.validation, en.form.fields)

const VALID = {
  firstName: 'Somchai',
  middleName: '',
  lastName: 'Jaidee',
  dateOfBirth: '1990-04-12',
  gender: 'Male',
  phone: '081 234 5678',
  email: 'somchai@example.com',
  address: '99/1 Sukhumvit Road, Khlong Toei, Bangkok 10110',
  preferredLanguage: 'Thai',
  nationality: 'Thai',
  religion: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
}

/** First error message for a field, or undefined if the field is fine. */
function errorFor(input: Record<string, string>, field: string) {
  const result = patientSchema.safeParse(input)
  if (result.success) return undefined
  return result.error.issues.find((issue: { path: (string | number | symbol)[] }) => issue.path[0] === field)
    ?.message
}

test('a complete form is accepted and trimmed', () => {
  const result = patientSchema.safeParse({ ...VALID, firstName: '  Somchai  ' })
  assert.equal(result.success, true)
  assert.equal(result.data?.firstName, 'Somchai')
})

test('required fields are required', () => {
  for (const field of ['firstName', 'lastName', 'dateOfBirth', 'gender', 'phone', 'email', 'address', 'preferredLanguage', 'nationality']) {
    assert.ok(errorFor({ ...VALID, [field]: '' }, field), `${field} should be required`)
  }
})

test('optional fields may be blank', () => {
  const result = patientSchema.safeParse({ ...VALID, middleName: '', religion: '' })
  assert.equal(result.success, true)
})

test('names accept Thai and accented scripts but not digits', () => {
  assert.equal(errorFor({ ...VALID, firstName: 'สมชาย' }, 'firstName'), undefined)
  assert.equal(errorFor({ ...VALID, lastName: "O'Brien-Smith" }, 'lastName'), undefined)
  assert.equal(errorFor({ ...VALID, firstName: 'José' }, 'firstName'), undefined)
  assert.ok(errorFor({ ...VALID, firstName: 'Bobby7' }, 'firstName'))
})

test('phone accepts local and international shapes, rejects short and lettered', () => {
  for (const phone of ['081 234 5678', '+66 81 234 5678', '(02) 123-4567', '0812345678']) {
    assert.equal(errorFor({ ...VALID, phone }, 'phone'), undefined, `${phone} should be valid`)
  }
  assert.ok(errorFor({ ...VALID, phone: '12345' }, 'phone'), 'too short')
  assert.ok(errorFor({ ...VALID, phone: '1234567890123456' }, 'phone'), 'too long')
  assert.ok(errorFor({ ...VALID, phone: '081-CALL-ME' }, 'phone'), 'letters')
})

test('email must look like an email', () => {
  assert.ok(errorFor({ ...VALID, email: 'somchai' }, 'email'))
  assert.ok(errorFor({ ...VALID, email: 'somchai@' }, 'email'))
  assert.equal(errorFor({ ...VALID, email: 'a.b+tag@sub.example.co.th' }, 'email'), undefined)
})

// <input type="date"> yields a local calendar date, and the schema compares it
// against local midnight — so the test has to build its dates the same way.
// toISOString() would drift by a day in any zone east of UTC.
function localDate(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

test('date of birth must be a real past date within a human lifespan', () => {
  assert.match(errorFor({ ...VALID, dateOfBirth: localDate(1) }, 'dateOfBirth') ?? '', /future/)
  // A baby born this morning is a patient, so today must be accepted.
  assert.equal(errorFor({ ...VALID, dateOfBirth: localDate(0) }, 'dateOfBirth'), undefined)
  assert.match(errorFor({ ...VALID, dateOfBirth: '1850-01-01' }, 'dateOfBirth') ?? '', /120 years/)
  assert.ok(errorFor({ ...VALID, dateOfBirth: 'not-a-date' }, 'dateOfBirth'))
  assert.equal(errorFor({ ...VALID, dateOfBirth: '2000-02-29' }, 'dateOfBirth'), undefined)
})

test('choice fields reject values that are not on the list', () => {
  assert.ok(errorFor({ ...VALID, gender: 'Yes' }, 'gender'))
  assert.ok(errorFor({ ...VALID, preferredLanguage: 'Klingon' }, 'preferredLanguage'))
  assert.ok(errorFor({ ...VALID, religion: 'Pastafarian' }, 'religion'))
})

test('an emergency contact needs both halves or neither', () => {
  assert.ok(errorFor({ ...VALID, emergencyContactName: 'Malee' }, 'emergencyContactRelationship'))
  assert.ok(errorFor({ ...VALID, emergencyContactRelationship: 'Parent' }, 'emergencyContactName'))
  assert.equal(
    patientSchema.safeParse({ ...VALID, emergencyContactName: 'Malee', emergencyContactRelationship: 'Parent' }).success,
    true,
  )
})

test('address must be more than a fragment', () => {
  assert.ok(errorFor({ ...VALID, address: 'Bangkok' }, 'address'))
})

test('progress counts only answered required fields', () => {
  assert.equal(countFilled(EMPTY_FORM), 0)
  assert.equal(countFilled(VALID), 9)
  // Optional answers must not inflate the progress bar.
  assert.equal(countFilled({ ...VALID, religion: 'Buddhism' }), 9)
  assert.equal(countFilled({ ...EMPTY_FORM, firstName: '   ' }), 0)
})

test('presence status ages from the last change staff received', () => {
  const now = 1_000_000
  const base: StaffSession = {
    sessionId: 'x',
    data: {},
    submitted: false,
    filled: 0,
    total: 9,
    startedAt: 0,
    online: true,
    changed: [],
    lastChangeAt: now,
  }

  assert.equal(deriveStatus(base, now + 2_000), 'filling')
  assert.equal(deriveStatus(base, now + 30_000), 'idle')
  assert.equal(deriveStatus(base, now + 120_000), 'inactive')
  assert.equal(deriveStatus({ ...base, online: false }, now + 1_000), 'disconnected')
  // Submitted is terminal: it outranks both idleness and disconnection.
  assert.equal(deriveStatus({ ...base, submitted: true }, now + 999_000), 'submitted')
  assert.equal(deriveStatus({ ...base, submitted: true, online: false }, now + 1_000), 'submitted')
})
