import type { Dictionary, Locale } from '@/i18n'
import { formatLongDate } from './calendar'
import {
  ADDRESS_MAX_LENGTH,
  GENDERS,
  LANGUAGES,
  MAX_NAME_LENGTH,
  NATIONALITIES,
  RELATIONSHIPS,
  RELIGIONS,
  type PatientForm,
} from './schema'

/**
 * One manifest, three consumers: the patient form inputs, the staff view rows,
 * and the progress calculation. Thirteen fields x three places is thirty-nine
 * hand-written declarations that drift; this is one list that cannot.
 *
 * Structure only — no copy. Labels, hints and placeholders live in the
 * dictionary keyed by field name, so the manifest is language-agnostic.
 */

export type FieldName = keyof PatientForm

export type SectionId = 'personal' | 'contact' | 'background'

/** Canonical values per option group; the dictionary supplies their labels. */
export const OPTION_VALUES = {
  gender: GENDERS,
  language: LANGUAGES,
  religion: RELIGIONS,
  relationship: RELATIONSHIPS,
  nationality: NATIONALITIES,
} as const

export type OptionsKey = keyof typeof OPTION_VALUES

export type FieldDef = {
  name: FieldName
  section: SectionId
  type: 'text' | 'tel' | 'email' | 'date' | 'select' | 'textarea' | 'combo'
  required: boolean
  /** Native autofill token — IxDF "make form filling faster with autofill". */
  autoComplete?: string
  inputMode?: 'text' | 'tel' | 'email' | 'numeric'
  /** Which option group supplies this field's values and translated labels. */
  optionsKey?: OptionsKey
  maxLength?: number
  /**
   * Desktop column span out of six. Always full width on mobile, so the form
   * stays the single column IxDF asks for on the screen size that matters most.
   * Pairing is only used where two inputs read as one question (given/family
   * name, phone/email, emergency contact name/relationship).
   */
  span?: 'full' | 'half' | 'third'
}

export const SECTION_IDS: readonly SectionId[] = ['personal', 'contact', 'background']

// Ordered simple -> complex -> sensitive, per IxDF "arrange questions wisely".
export const FIELDS: readonly FieldDef[] = [
  { name: 'firstName', section: 'personal', type: 'text', required: true, autoComplete: 'given-name', maxLength: MAX_NAME_LENGTH, span: 'third' },
  { name: 'middleName', section: 'personal', type: 'text', required: false, autoComplete: 'additional-name', maxLength: MAX_NAME_LENGTH, span: 'third' },
  { name: 'lastName', section: 'personal', type: 'text', required: true, autoComplete: 'family-name', maxLength: MAX_NAME_LENGTH, span: 'third' },
  { name: 'dateOfBirth', section: 'personal', type: 'date', required: true, autoComplete: 'bday', span: 'half' },
  { name: 'gender', section: 'personal', type: 'select', required: true, optionsKey: 'gender', span: 'half' },

  { name: 'phone', section: 'contact', type: 'tel', required: true, autoComplete: 'tel', inputMode: 'tel', span: 'half' },
  { name: 'email', section: 'contact', type: 'email', required: true, autoComplete: 'email', inputMode: 'email', span: 'half' },
  { name: 'address', section: 'contact', type: 'textarea', required: true, autoComplete: 'street-address', maxLength: ADDRESS_MAX_LENGTH },

  { name: 'preferredLanguage', section: 'background', type: 'select', required: true, optionsKey: 'language', span: 'half' },
  { name: 'nationality', section: 'background', type: 'combo', required: true, autoComplete: 'country-name', optionsKey: 'nationality', maxLength: MAX_NAME_LENGTH, span: 'half' },
  { name: 'religion', section: 'background', type: 'select', required: false, optionsKey: 'religion' },
  { name: 'emergencyContactName', section: 'background', type: 'text', required: false, autoComplete: 'off', maxLength: MAX_NAME_LENGTH, span: 'half' },
  { name: 'emergencyContactRelationship', section: 'background', type: 'select', required: false, optionsKey: 'relationship', span: 'half' },
]

export const FIELDS_BY_SECTION = SECTION_IDS.map((id) => ({
  id,
  fields: FIELDS.filter((field) => field.section === id),
}))

export const REQUIRED_FIELDS = FIELDS.filter((f) => f.required).map((f) => f.name)

export const EMPTY_FORM = Object.fromEntries(FIELDS.map((f) => [f.name, ''])) as PatientForm

/** Required fields the patient has actually answered — drives the progress bar. */
export function countFilled(values: Partial<PatientForm>): number {
  return REQUIRED_FIELDS.filter((name) => (values[name] ?? '').trim() !== '').length
}

/**
 * Canonical stored values are English; show the reader their own language.
 * Nationality is free text, so an unmatched value is simply what was typed.
 */
export function displayValue(
  field: FieldDef,
  value: string,
  dict: Dictionary,
  locale?: Locale,
): string {
  if (value === '') return value
  // A date is stored as `1990-03-14` and was being shown that way on the
  // receipt and the staff card, while the field the patient filled in read
  // "14 มีนาคม 1990". Same value, three surfaces, two spellings.
  //
  // The locale is optional rather than required because the CSV deliberately
  // wants the ISO form: see the note on stamp() in export.ts — a localised
  // Thai date would switch the spreadsheet to the Buddhist era mid-file, and
  // ISO is what sorts correctly in a spreadsheet anyway. Passing a locale is
  // therefore the explicit request for a human-facing date.
  if (field.type === 'date') return locale ? formatLongDate(value, locale) : value
  if (!field.optionsKey) return value
  const labels: Record<string, string> = dict.form.options[field.optionsKey]
  return labels[value] ?? value
}

/** Desktop column spans for the six-column form grid. */
export const SPAN_CLASS: Record<NonNullable<FieldDef['span']>, string> = {
  full: 'sm:col-span-6',
  half: 'sm:col-span-3',
  third: 'sm:col-span-2',
}
