'use client'

import { useState } from 'react'
import type { Dictionary, Locale } from '@/i18n'
import { COUNTRIES, composePhone, countryName, flagFor, parsePhone } from '@/lib/phone'
import { Listbox, type ListboxOption } from './Listbox'

/**
 * Country code plus national number, writing back into the single `phone` string
 * the form already holds. The schema, the CSV and the presence payload never see
 * two fields — this is only a nicer way of typing one value.
 *
 * The chosen country is local state rather than derived on every render, so
 * picking a country before typing any digits does not immediately get parsed
 * back to the default from an empty value.
 */
export function PhoneField({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
  required,
  placeholder,
  dict,
  locale,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  invalid?: boolean
  describedBy?: string
  required?: boolean
  placeholder?: string
  dict: Dictionary
  locale: Locale
}) {
  const parsed = parsePhone(value)
  const [iso2, setIso2] = useState(parsed.iso2)

  const options: ListboxOption[] = COUNTRIES.map((country) => ({
    value: country.iso2,
    label: countryName(country.iso2, locale),
    hint: country.dial,
    prefix: flagFor(country.iso2),
  }))

  const dial = COUNTRIES.find((country) => country.iso2 === iso2)?.dial ?? ''

  return (
    <div className="flex gap-2">
      <div className="w-[7.5rem] shrink-0">
        <Listbox
          id={`${id}-country`}
          value={iso2}
          onChange={(next) => {
            setIso2(next)
            onChange(composePhone(next, parsed.national))
          }}
          options={options}
          placeholder={dict.picker.country}
          searchable
          labels={{ search: dict.picker.search, empty: dict.picker.empty, use: dict.picker.useCustom }}
          ariaLabel={dict.picker.country}
          renderValue={(option) => (
            <span className="flex items-center gap-1.5">
              <span className="text-lg leading-none">{option ? flagFor(option.value) : ''}</span>
              <span className="text-sm font-semibold">{dial}</span>
            </span>
          )}
        />
      </div>

      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={parsed.national}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        onChange={(event) => onChange(composePhone(iso2, event.target.value))}
        onBlur={onBlur}
        className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-ink transition-colors placeholder:text-muted focus:outline-none focus:shadow-ring ${
          invalid ? 'border-state-error' : 'border-line hover:border-brand focus:border-brand'
        }`}
      />
    </div>
  )
}
