import { z } from 'zod'
import { fill, type Dictionary } from '@/i18n'

/* ------------------------------------------------------------------ *
 * Canonical option values. These stay English in every language: they are
 * what gets stored, validated and synced, while the dictionary supplies the
 * label the patient reads. Without that split, switching language mid-form
 * would invalidate every answer the patient had already chosen.
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

/* ------------------------------------------------------------------ */

export const MAX_NAME_LENGTH = 60
export const MAX_AGE = 120
export const PHONE_MIN_DIGITS = 9
export const PHONE_MAX_DIGITS = 15
export const ADDRESS_MIN_LENGTH = 10
export const ADDRESS_MAX_LENGTH = 300

// \p{L}\p{M} keeps Thai, Chinese and accented Latin names valid — a Latin-only
// [A-Za-z] rule would reject most of this clinic's actual patients.
const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M}'\-. ]*$/u

type Messages = Dictionary['validation']
type FieldCopy = Dictionary['form']['fields']

/**
 * The schema is built per locale rather than declared once, because every
 * message the patient reads has to be in their language. Callers memoise it on
 * the dictionary.
 */
export function makePatientSchema(messages: Messages, copy: FieldCopy) {
  const label = (field: keyof FieldCopy) => copy[field].label
  const say = (template: string, values: Record<string, string | number> = {}) => fill(template, values)

  const requiredName = (field: keyof FieldCopy) =>
    z
      .string()
      .trim()
      .min(1, say(messages.required, { label: label(field) }))
      .max(MAX_NAME_LENGTH, say(messages.tooLong, { label: label(field), max: MAX_NAME_LENGTH }))
      .refine((v) => PERSON_NAME.test(v), say(messages.nameChars, { label: label(field) }))

  const optionalName = (field: keyof FieldCopy) =>
    z
      .string()
      .trim()
      .max(MAX_NAME_LENGTH, say(messages.tooLong, { label: label(field), max: MAX_NAME_LENGTH }))
      .refine((v) => v === '' || PERSON_NAME.test(v), say(messages.nameChars, { label: label(field) }))

  // Validated as a plain string rather than z.enum: every field stays `string`,
  // so '' is a legal default and the presence payload needs no coercion.
  const requiredChoice = (values: readonly string[], message: string) =>
    z
      .string()
      .min(1, message)
      .refine((v) => values.includes(v), message)

  const optionalChoice = (values: readonly string[]) =>
    z.string().refine((v) => v === '' || values.includes(v), messages.chooseFromList)

  const dateOfBirth = z.string().superRefine((value, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message })
    if (value === '') return fail(messages.dobRequired)

    const parsed = new Date(`${value}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return fail(messages.dobInvalid)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // A baby born this morning is a patient, so today itself is allowed.
    if (parsed > today) return fail(messages.dobFuture)

    const floor = new Date(today)
    floor.setFullYear(floor.getFullYear() - MAX_AGE)
    if (parsed < floor) return fail(say(messages.dobTooOld, { max: MAX_AGE }))
  })

  const phone = z
    .string()
    .trim()
    .min(1, say(messages.required, { label: label('phone') }))
    .refine((v) => /^[\d\s()+-]+$/.test(v), messages.phoneChars)
    // Digit-count check rather than a country regex: patients here dial Thai
    // mobiles, Thai landlines and foreign numbers, and E.164 allows 15 digits.
    .refine((v) => {
      const digits = v.replace(/\D/g, '')
      return digits.length >= PHONE_MIN_DIGITS && digits.length <= PHONE_MAX_DIGITS
    }, say(messages.phoneLength, { min: PHONE_MIN_DIGITS, max: PHONE_MAX_DIGITS }))

  const email = z
    .string()
    .trim()
    .min(1, say(messages.required, { label: label('email') }))
    .refine((v) => z.email().safeParse(v).success, messages.emailInvalid)

  return z
    .object({
      firstName: requiredName('firstName'),
      middleName: optionalName('middleName'),
      lastName: requiredName('lastName'),
      dateOfBirth,
      gender: requiredChoice(GENDERS, say(messages.chooseOne, { label: label('gender') })),

      phone,
      email,
      address: z
        .string()
        .trim()
        .min(ADDRESS_MIN_LENGTH, messages.addressTooShort)
        .max(ADDRESS_MAX_LENGTH, say(messages.tooLong, { label: label('address'), max: ADDRESS_MAX_LENGTH })),

      preferredLanguage: requiredChoice(
        LANGUAGES,
        say(messages.chooseOne, { label: label('preferredLanguage') }),
      ),
      nationality: z
        .string()
        .trim()
        .min(2, messages.nationalityTooShort)
        .max(MAX_NAME_LENGTH, say(messages.tooLong, { label: label('nationality'), max: MAX_NAME_LENGTH }))
        .refine((v) => PERSON_NAME.test(v), say(messages.nameChars, { label: label('nationality') })),
      religion: optionalChoice(RELIGIONS),
      emergencyContactName: optionalName('emergencyContactName'),
      emergencyContactRelationship: optionalChoice(RELATIONSHIPS),
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
          message: messages.emergencyNeedsRelationship,
        })
      }
      if (!hasName && hasRelationship) {
        ctx.addIssue({ code: 'custom', path: ['emergencyContactName'], message: messages.emergencyNeedsName })
      }
    })
}

export type PatientSchema = ReturnType<typeof makePatientSchema>
export type PatientForm = z.infer<PatientSchema>
