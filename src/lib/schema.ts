import { z } from 'zod'

/* ------------------------------------------------------------------ *
 * Option sets. Exported so the form renders from the same values the
 * schema validates against — one source of truth, no drift.
 * ------------------------------------------------------------------ */

export const GENDERS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'] as const

export const LANGUAGES = [
  'Thai', 'English', 'Chinese (Mandarin)', 'Japanese', 'Korean',
  'Burmese', 'Khmer', 'Lao', 'Arabic', 'Other',
] as const

export const RELIGIONS = [
  'Buddhism', 'Christianity', 'Islam', 'Hinduism', 'Sikhism',
  'Judaism', 'No religion', 'Other', 'Prefer not to say',
] as const

export const RELATIONSHIPS = [
  'Parent', 'Spouse or partner', 'Sibling', 'Child',
  'Other relative', 'Friend', 'Caregiver', 'Other',
] as const

/** Suggestions for the nationality combo box — a hint list, not a whitelist. */
export const NATIONALITIES = [
  'Thai', 'American', 'British', 'Australian', 'Canadian', 'Chinese',
  'Japanese', 'Korean', 'Indian', 'Singaporean', 'Malaysian', 'Vietnamese',
  'Filipino', 'Indonesian', 'Burmese', 'Lao', 'Cambodian', 'German',
  'French', 'Dutch', 'Russian', 'Brazilian',
] as const

/* ------------------------------------------------------------------ *
 * Builders
 * ------------------------------------------------------------------ */

// \p{L}\p{M} keeps Thai, Chinese and accented Latin names valid — a Latin-only
// [A-Za-z] rule would reject most of this clinic's actual patients.
const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M}'\-. ]*$/u
const NAME_HINT = 'may only contain letters, spaces, hyphens and apostrophes'

const requiredName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(60, `${label} must be 60 characters or fewer`)
    .refine((v) => PERSON_NAME.test(v), `${label} ${NAME_HINT}`)

const optionalName = (label: string) =>
  z
    .string()
    .trim()
    .max(60, `${label} must be 60 characters or fewer`)
    .refine((v) => v === '' || PERSON_NAME.test(v), `${label} ${NAME_HINT}`)

// Validated as a plain string rather than z.enum: every field stays `string`,
// so '' is a legal default and the presence payload needs no coercion.
const requiredChoice = (values: readonly string[], message: string) =>
  z
    .string()
    .min(1, message)
    .refine((v) => values.includes(v), message)

const optionalChoice = (values: readonly string[], message: string) =>
  z.string().refine((v) => v === '' || values.includes(v), message)

const MAX_AGE = 120

const dateOfBirth = z.string().superRefine((v, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message })
  if (v === '') return fail('Date of birth is required')

  const parsed = new Date(`${v}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return fail('Enter a valid date in YYYY-MM-DD format')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (parsed > today) return fail('Date of birth cannot be in the future')

  const floor = new Date(today)
  floor.setFullYear(floor.getFullYear() - MAX_AGE)
  if (parsed < floor) return fail(`Date of birth cannot be more than ${MAX_AGE} years ago`)
})

const phone = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .refine((v) => /^[\d\s()+-]+$/.test(v), 'Phone number may only contain digits, spaces and + ( ) -')
  // Digit-count check rather than a country regex: patients here dial Thai
  // mobiles, Thai landlines and foreign numbers, and E.164 allows 15 digits.
  .refine((v) => {
    const digits = v.replace(/\D/g, '')
    return digits.length >= 9 && digits.length <= 15
  }, 'Enter a valid phone number (9–15 digits)')

const email = z
  .string()
  .trim()
  .min(1, 'Email address is required')
  .refine((v) => z.email().safeParse(v).success, 'Enter a valid email address, e.g. name@example.com')

/* ------------------------------------------------------------------ *
 * Schema
 * ------------------------------------------------------------------ */

export const patientSchema = z
  .object({
    firstName: requiredName('First name'),
    middleName: optionalName('Middle name'),
    lastName: requiredName('Last name'),
    dateOfBirth,
    gender: requiredChoice(GENDERS, 'Please select a gender'),

    phone,
    email,
    address: z
      .string()
      .trim()
      .min(10, 'Please include street, city and postal code')
      .max(300, 'Address must be 300 characters or fewer'),

    preferredLanguage: requiredChoice(LANGUAGES, 'Please choose your preferred language'),
    nationality: z
      .string()
      .trim()
      .min(2, 'Nationality is required')
      .max(60, 'Nationality must be 60 characters or fewer')
      .refine((v) => PERSON_NAME.test(v), `Nationality ${NAME_HINT}`),
    religion: optionalChoice(RELIGIONS, 'Please choose an option from the list'),
    emergencyContactName: optionalName('Emergency contact name'),
    emergencyContactRelationship: optionalChoice(RELATIONSHIPS, 'Please choose an option from the list'),
  })
  // Half an emergency contact is worse than none — staff would call a name
  // with no idea who they are reaching.
  .superRefine((values, ctx) => {
    const hasName = values.emergencyContactName.trim() !== ''
    const hasRelationship = values.emergencyContactRelationship !== ''
    if (hasName && !hasRelationship) {
      ctx.addIssue({
        code: 'custom',
        path: ['emergencyContactRelationship'],
        message: 'Tell us how this person is related to you',
      })
    }
    if (!hasName && hasRelationship) {
      ctx.addIssue({
        code: 'custom',
        path: ['emergencyContactName'],
        message: 'Add the name of your emergency contact',
      })
    }
  })

export type PatientForm = z.infer<typeof patientSchema>
