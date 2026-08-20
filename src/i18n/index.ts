import en from './en'
import th from './th'
import type { Locale } from './config'

export type Dictionary = typeof en

const DICTIONARIES: Record<Locale, Dictionary> = { en, th }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

/**
 * Fills `{name}` placeholders. Four lines instead of an i18n runtime: with two
 * languages and no date/number/currency formatting to do, a library would be
 * more configuration than code.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`))
}

/**
 * Thai has no plural inflection and English has one rule, so a two-form picker
 * covers both. Only two strings in the app need it.
 */
export function plural(forms: { one: string; other: string }, count: number, key = 'count'): string {
  return fill(count === 1 ? forms.one : forms.other, { [key]: count })
}

export type { Locale }
export { LOCALES, DEFAULT_LOCALE, LOCALE_NAMES, isLocale } from './config'
