export const LOCALES = ['th', 'en'] as const

export type Locale = (typeof LOCALES)[number]

/** Thai first: this is a Thai clinic, and the patients are the primary users. */
export const DEFAULT_LOCALE: Locale = 'th'

/** Each language named in itself, never translated — a reader who cannot read
 *  the current language still has to recognise their own. */
export const LOCALE_NAMES: Record<Locale, string> = { th: 'ไทย', en: 'English' }

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}
