import {
  GENDERS,
  LANGUAGES,
  NATIONALITIES,
  RELATIONSHIPS,
  RELIGIONS,
  type PatientForm,
} from './schema'

/**
 * One manifest, three consumers: the patient form inputs, the staff view rows,
 * and the progress calculation. Thirteen fields x three places is thirty-nine
 * hand-written declarations that drift; this is one list that cannot.
 */

export type FieldName = keyof PatientForm

export type SectionId = 'personal' | 'contact' | 'background'

export type FieldDef = {
  name: FieldName
  label: string
  section: SectionId
  type: 'text' | 'tel' | 'email' | 'date' | 'select' | 'textarea' | 'combo'
  required: boolean
  /** Native autofill token — IxDF "make form filling faster with autofill". */
  autoComplete?: string
  inputMode?: 'text' | 'tel' | 'email' | 'numeric'
  placeholder?: string
  /** Format or purpose hint shown under the label, before any error. */
  hint?: string
  options?: readonly string[]
  maxLength?: number
  /**
   * Desktop column span out of six. Always full width on mobile, so the form
   * stays the single column IxDF asks for on the screen size that matters most.
   * Pairing is only used where two inputs read as one question (given/family
   * name, phone/email, emergency contact name/relationship).
   */
  span?: 'full' | 'half' | 'third'
}

export const SECTIONS: readonly { id: SectionId; title: string; blurb: string }[] = [
  {
    id: 'personal',
    title: 'Who you are',
    blurb: 'Your name and date of birth, exactly as they appear on your ID or passport.',
  },
  {
    id: 'contact',
    title: 'How we reach you',
    blurb: 'We use these to confirm your appointment and send your results — nothing else.',
  },
  {
    id: 'background',
    title: 'A few last details',
    blurb:
      'These help us care for you well. Anything marked optional can be left blank if you would rather not share it.',
  },
]

// Ordered simple -> complex -> sensitive, per IxDF "arrange questions wisely".
export const FIELDS: readonly FieldDef[] = [
  {
    name: 'firstName',
    label: 'First name',
    section: 'personal',
    type: 'text',
    required: true,
    autoComplete: 'given-name',
    placeholder: 'Somchai',
    maxLength: 60,
    span: 'third',
  },
  {
    name: 'middleName',
    label: 'Middle name',
    section: 'personal',
    type: 'text',
    required: false,
    autoComplete: 'additional-name',
    maxLength: 60,
    span: 'third',
  },
  {
    name: 'lastName',
    label: 'Last name',
    section: 'personal',
    type: 'text',
    required: true,
    autoComplete: 'family-name',
    placeholder: 'Jaidee',
    maxLength: 60,
    span: 'third',
  },
  {
    name: 'dateOfBirth',
    label: 'Date of birth',
    section: 'personal',
    type: 'date',
    required: true,
    autoComplete: 'bday',
    hint: 'Year, month, day',
    span: 'half',
  },
  {
    name: 'gender',
    label: 'Gender',
    section: 'personal',
    type: 'select',
    required: true,
    autoComplete: 'sex',
    options: GENDERS,
    span: 'half',
  },

  {
    name: 'phone',
    label: 'Phone number',
    section: 'contact',
    type: 'tel',
    required: true,
    autoComplete: 'tel',
    inputMode: 'tel',
    placeholder: '081 234 5678',
    hint: 'Mobile preferred, so we can send you a reminder',
    span: 'half',
  },
  {
    name: 'email',
    label: 'Email address',
    section: 'contact',
    type: 'email',
    required: true,
    autoComplete: 'email',
    inputMode: 'email',
    placeholder: 'somchai@example.com',
    span: 'half',
  },
  {
    name: 'address',
    label: 'Home address',
    section: 'contact',
    type: 'textarea',
    required: true,
    autoComplete: 'street-address',
    placeholder: '99/1 Sukhumvit Road, Khlong Toei, Bangkok 10110',
    hint: 'Street, district, city and postal code',
    maxLength: 300,
  },

  {
    name: 'preferredLanguage',
    label: 'Preferred language',
    section: 'background',
    type: 'select',
    required: true,
    options: LANGUAGES,
    hint: 'The language you would like us to speak and write in',
    span: 'half',
  },
  {
    name: 'nationality',
    label: 'Nationality',
    section: 'background',
    type: 'combo',
    required: true,
    autoComplete: 'country-name',
    options: NATIONALITIES,
    placeholder: 'Thai',
    hint: 'Start typing, or pick from the list',
    maxLength: 60,
    span: 'half',
  },
  {
    name: 'religion',
    label: 'Religion',
    section: 'background',
    type: 'select',
    required: false,
    options: RELIGIONS,
    hint: 'Only so we can respect your dietary and care preferences',
  },
  {
    name: 'emergencyContactName',
    label: 'Emergency contact name',
    section: 'background',
    type: 'text',
    required: false,
    autoComplete: 'off',
    placeholder: 'Malee Jaidee',
    maxLength: 60,
    span: 'half',
  },
  {
    name: 'emergencyContactRelationship',
    label: 'Relationship to you',
    section: 'background',
    type: 'select',
    required: false,
    options: RELATIONSHIPS,
    span: 'half',
  },
]

export const FIELDS_BY_SECTION = SECTIONS.map((section) => ({
  ...section,
  fields: FIELDS.filter((field) => field.section === section.id),
}))

export const FIELD_LABELS = Object.fromEntries(FIELDS.map((f) => [f.name, f.label])) as Record<
  FieldName,
  string
>

export const REQUIRED_FIELDS = FIELDS.filter((f) => f.required).map((f) => f.name)

export const EMPTY_FORM = Object.fromEntries(FIELDS.map((f) => [f.name, ''])) as PatientForm

/** Required fields the patient has actually answered — drives the progress bar. */
export function countFilled(values: Partial<PatientForm>): number {
  return REQUIRED_FIELDS.filter((name) => (values[name] ?? '').trim() !== '').length
}

/** Desktop column spans for the six-column form grid. */
export const SPAN_CLASS: Record<NonNullable<FieldDef['span']>, string> = {
  full: 'sm:col-span-6',
  half: 'sm:col-span-3',
  third: 'sm:col-span-2',
}
