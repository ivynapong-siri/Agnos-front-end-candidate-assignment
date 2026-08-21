import assert from 'node:assert/strict'
import { test } from 'node:test'
import en from '../i18n/en'
import th from '../i18n/th'
import { LOCALES, fill, getDictionary, isLocale, plural } from '../i18n'
import { FIELDS, OPTION_VALUES } from './fields'

/**
 * A missing translation is invisible in review and obvious to a patient. These
 * tests make it a failing build instead: th.ts is already typed as Dictionary,
 * and this covers what the type cannot — that no value is an empty stub, and
 * that every option a patient can pick has a label in every language.
 */

type Node = Record<string, unknown>

/** Every leaf path in an object, e.g. "form.fields.firstName.label". */
function paths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value as Node).flatMap(([key, child]) =>
    paths(child, prefix ? `${prefix}.${key}` : key),
  )
}

function leaf(dict: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => (node as Node)?.[key], dict)
}

test('every locale resolves to a dictionary', () => {
  for (const locale of LOCALES) {
    assert.ok(getDictionary(locale), `${locale} has a dictionary`)
  }
  assert.ok(isLocale('th'))
  assert.ok(isLocale('en'))
  assert.equal(isLocale('fr'), false)
})

test('dictionaries have matching shapes', () => {
  const english = paths(en).sort()
  const thai = paths(th).sort()

  assert.deepEqual(
    thai.filter((key) => !english.includes(key)),
    [],
    'Thai has keys English does not',
  )
  assert.deepEqual(
    english.filter((key) => !thai.includes(key)),
    [],
    'Thai is missing keys English has',
  )
})

test('no translated string is an accidental stub', () => {
  // Placeholders and hints are legitimately blank, so they are exempt.
  const mayBeBlank = /\.(placeholder|hint)$/
  for (const dict of [en, th]) {
    for (const path of paths(dict)) {
      const value = leaf(dict, path)
      assert.equal(typeof value, 'string', `${path} is a string`)
      if (!mayBeBlank.test(path)) {
        assert.notEqual((value as string).trim(), '', `${path} is not empty`)
      }
    }
  }
})

test('every placeholder a template uses is one a caller fills', () => {
  // Catches a typo like {filed} that would render literally on the page.
  const KNOWN = new Set([
    'total', 'optional', 'filled', 'count', 'name', 'label', 'max', 'min',
    'idle', 'inactive', 'status', 'n', 'example', 'local', 'value',
    // Staff auth: the invite code on the register hint, and the address the
    // reset confirmation reads back.
    'code', 'email',
  ])
  for (const dict of [en, th]) {
    for (const path of paths(dict)) {
      const value = leaf(dict, path) as string
      for (const [, token] of value.matchAll(/\{(\w+)\}/g)) {
        assert.ok(KNOWN.has(token), `${path} uses unknown placeholder {${token}}`)
      }
    }
  }
})

test('every selectable option has a label in every language', () => {
  for (const dict of [en, th]) {
    for (const [group, values] of Object.entries(OPTION_VALUES)) {
      const labels = dict.form.options[group as keyof typeof OPTION_VALUES] as Record<string, string>
      for (const value of values) {
        assert.ok(labels[value], `${group}.${value} has no label`)
      }
      assert.deepEqual(
        Object.keys(labels).filter((key) => !(values as readonly string[]).includes(key)),
        [],
        `${group} has labels for values that no longer exist`,
      )
    }
  }
})

test('every field has copy in every language', () => {
  for (const dict of [en, th]) {
    for (const field of FIELDS) {
      assert.ok(dict.form.fields[field.name]?.label, `${field.name} has no label`)
    }
  }
})

test('fill substitutes what it is given and flags what it is not', () => {
  assert.equal(fill('{filled} of {total}', { filled: 3, total: 9 }), '3 of 9')
  assert.equal(fill('no tokens here', {}), 'no tokens here')
  // Left visible rather than silently blanked, so a missing value is noticed.
  assert.equal(fill('hello {who}', {}), 'hello {who}')
})

test('plural picks the singular form only for exactly one', () => {
  const forms = { one: '1 answer', other: '{count} answers' }
  assert.equal(plural(forms, 1), '1 answer')
  assert.equal(plural(forms, 0), '0 answers')
  assert.equal(plural(forms, 7), '7 answers')
})
