import type { Locale } from '@/i18n'

/**
 * Country dial codes for the phone field.
 *
 * Only the ISO code and the dial code are stored — country *names* come from
 * `Intl.DisplayNames`, which every browser ships, so there are no eighty
 * translated country names to maintain and every future locale is free.
 *
 * The list is scoped rather than exhaustive: Thailand, its neighbours, and the
 * places this clinic's foreign patients actually come from. A searchable list of
 * forty is usable; two hundred and fifty is not.
 */
export const COUNTRIES = [
  { iso2: 'TH', dial: '+66' },
  { iso2: 'MM', dial: '+95' },
  { iso2: 'LA', dial: '+856' },
  { iso2: 'KH', dial: '+855' },
  { iso2: 'VN', dial: '+84' },
  { iso2: 'MY', dial: '+60' },
  { iso2: 'SG', dial: '+65' },
  { iso2: 'ID', dial: '+62' },
  { iso2: 'PH', dial: '+63' },
  { iso2: 'BN', dial: '+673' },
  { iso2: 'CN', dial: '+86' },
  { iso2: 'HK', dial: '+852' },
  { iso2: 'TW', dial: '+886' },
  { iso2: 'JP', dial: '+81' },
  { iso2: 'KR', dial: '+82' },
  { iso2: 'IN', dial: '+91' },
  { iso2: 'BD', dial: '+880' },
  { iso2: 'NP', dial: '+977' },
  { iso2: 'PK', dial: '+92' },
  { iso2: 'LK', dial: '+94' },
  { iso2: 'AU', dial: '+61' },
  { iso2: 'NZ', dial: '+64' },
  { iso2: 'GB', dial: '+44' },
  { iso2: 'IE', dial: '+353' },
  { iso2: 'FR', dial: '+33' },
  { iso2: 'DE', dial: '+49' },
  { iso2: 'NL', dial: '+31' },
  { iso2: 'BE', dial: '+32' },
  { iso2: 'CH', dial: '+41' },
  { iso2: 'AT', dial: '+43' },
  { iso2: 'IT', dial: '+39' },
  { iso2: 'ES', dial: '+34' },
  { iso2: 'PT', dial: '+351' },
  { iso2: 'SE', dial: '+46' },
  { iso2: 'NO', dial: '+47' },
  { iso2: 'DK', dial: '+45' },
  { iso2: 'FI', dial: '+358' },
  { iso2: 'PL', dial: '+48' },
  { iso2: 'RU', dial: '+7' },
  { iso2: 'TR', dial: '+90' },
  { iso2: 'IL', dial: '+972' },
  { iso2: 'AE', dial: '+971' },
  { iso2: 'SA', dial: '+966' },
  { iso2: 'QA', dial: '+974' },
  { iso2: 'EG', dial: '+20' },
  { iso2: 'ZA', dial: '+27' },
  { iso2: 'US', dial: '+1' },
  { iso2: 'CA', dial: '+1' },
  { iso2: 'MX', dial: '+52' },
  { iso2: 'BR', dial: '+55' },
] as const

export type Country = (typeof COUNTRIES)[number]

export const DEFAULT_ISO2 = 'TH'

/** Regional-indicator letters render as a flag, so no icon assets are needed. */
export function flagFor(iso2: string): string {
  return String.fromCodePoint(...[...iso2.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

/**
 * `style: 'short'` is not cosmetic. Node's ICU returns the full political name
 * for Hong Kong — "Hong Kong SAR China" — while Chrome returns "Hong Kong", so
 * the server and the client rendered different text and hydration failed on it.
 * The short style agrees across both, and reads better anyway.
 */
export function countryName(iso2: string, locale: Locale): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region', style: 'short' }).of(iso2) ?? iso2
  } catch {
    return iso2
  }
}

/**
 * Splits a stored phone value into the country and the national part.
 *
 * The form still holds one string — `"+66 812345678"` — so the schema, the CSV
 * and the presence payload are untouched by the country selector; it is purely a
 * way of typing that one value.
 *
 * Dial codes are matched longest-first, because short ones are prefixes of long
 * ones: `+66` (Thailand) is a prefix of nothing, but `+6` families collide —
 * `+65`, `+66`, `+673` — and matching in list order would pick the wrong one.
 */
export function parsePhone(value: string): { iso2: string; national: string } {
  const trimmed = value.trim()
  if (!trimmed.startsWith('+')) return { iso2: DEFAULT_ISO2, national: trimmed }

  const matches = COUNTRIES.filter((country) => trimmed.startsWith(country.dial)).sort(
    (a, b) => b.dial.length - a.dial.length,
  )
  const best = matches[0]
  if (!best) return { iso2: DEFAULT_ISO2, national: trimmed }

  return { iso2: best.iso2, national: trimmed.slice(best.dial.length).trim() }
}

/**
 * Recombines them. The leading trunk zero is dropped, because a Thai patient
 * types their mobile the way they always write it — 081… — and `+66 081…` is
 * not a dialable number.
 */
export function composePhone(iso2: string, national: string): string {
  const country = COUNTRIES.find((entry) => entry.iso2 === iso2)
  const digits = national.replace(/^0+/, '').trim()
  if (!country) return national.trim()
  return digits === '' ? '' : `${country.dial} ${digits}`
}
