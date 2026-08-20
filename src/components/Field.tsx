'use client'

import { useController, useFormContext } from 'react-hook-form'
import type { Dictionary, Locale } from '@/i18n'
import { OPTION_VALUES, type FieldDef } from '@/lib/fields'
import { MAX_AGE, type PatientForm } from '@/lib/schema'
import { DateField } from './DateField'
import { Listbox } from './Listbox'
import { PhoneField } from './PhoneField'

/**
 * One component for every input shape. The shape comes from the field manifest
 * and the copy from the dictionary, so adding a field is a data change and
 * adding a language touches no JSX.
 *
 * Everything goes through useController rather than register: the custom
 * controls take a value and a callback rather than a ref, and having one path
 * instead of two removes the branching that would otherwise sit around every
 * control. Field is its own component, so a keystroke re-renders only itself.
 *
 * Accessibility contract, since this is the only place it can be enforced:
 *   - every control has a real <label for>, never a placeholder as its label
 *   - aria-invalid + aria-describedby wire the error to the control
 *   - errors are announced via role="alert"
 *   - hit areas clear the 44px touch-target floor
 */

const INPUT =
  'w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-ink transition-colors ' +
  'placeholder:text-muted focus:outline-none focus:shadow-ring'

function borderFor(error: boolean, valid: boolean) {
  if (error) return 'border-state-error focus:border-state-error'
  if (valid) return 'border-state-ok/40 focus:border-brand'
  return 'border-line hover:border-brand focus:border-brand'
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <path
        d="M3 8.5l3.2 3.2L13 5"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-state-ok"
      />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.6" strokeWidth="1.6" className="stroke-state-error" />
      <path d="M8 4.8v4.1M8 11.4h.01" strokeWidth="1.8" strokeLinecap="round" className="stroke-state-error" />
    </svg>
  )
}

export function Field({ def, dict, locale }: { def: FieldDef; dict: Dictionary; locale: Locale }) {
  const { control } = useFormContext<PatientForm>()
  const { field, fieldState } = useController({ control, name: def.name })
  // Pulled out and renamed: react-hooks/refs rejects reading a `.ref` property
  // during render, even though RHF's is a callback ref. It is what lets RHF
  // focus the first invalid field on submit, so it is kept, not dropped.
  const { ref: registerRef, name: fieldName } = field

  const copy = dict.form.fields[def.name]
  const value = field.value ?? ''
  const error = fieldState.error?.message
  const valid = !error && fieldState.isTouched && value.trim() !== ''

  const hintId = copy.hint ? `${def.name}-hint` : undefined
  const errorId = error ? `${def.name}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  // Widened to Record<string, string> once, rather than asserting at the call
  // site: the union of five option maps has no shared index signature.
  const optionLabels: Record<string, string> = def.optionsKey ? dict.form.options[def.optionsKey] : {}
  const optionValues: readonly string[] = def.optionsKey ? OPTION_VALUES[def.optionsKey] : []

  const pickerLabels = {
    search: dict.picker.search,
    empty: dict.picker.empty,
    use: dict.picker.useCustom,
  }

  /** For the custom controls, which declare these as props. */
  const shared = {
    id: def.name,
    value,
    onChange: field.onChange,
    onBlur: field.onBlur,
    invalid: Boolean(error),
    describedBy,
    required: def.required,
  }

  /**
   * For native <input> and <textarea>. Deliberately not `shared`: invalid,
   * describedBy and required are not DOM attributes, and spreading them onto a
   * real element leaks them into the HTML and warns on every render.
   */
  const nativeProps = {
    id: def.name,
    name: fieldName,
    value,
    onChange: field.onChange,
    onBlur: field.onBlur,
    maxLength: def.maxLength,
    placeholder: copy.placeholder || undefined,
    autoComplete: def.autoComplete,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    'aria-required': def.required || undefined,
  }

  return (
    <div>
      <label
        htmlFor={def.name}
        className="mb-1.5 flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-navy-900"
      >
        {copy.label}
        {/* Mark what can be skipped, not what is mandatory: on a form that is
            mostly required, a wall of asterisks tells the patient nothing. */}
        {!def.required && <span className="text-xs font-normal text-muted">{dict.form.optional}</span>}
      </label>

      <div className="relative">
        {def.type === 'select' || def.type === 'combo' ? (
          <Listbox
            {...shared}
            options={optionValues.map((option) => ({
              value: option,
              label: optionLabels[option] ?? option,
            }))}
            placeholder={dict.form.choose}
            // A combo is free text with suggestions, so an unlisted answer has
            // to be accepted — nationality cannot be a closed list.
            searchable={def.type === 'combo'}
            allowCustom={def.type === 'combo'}
            labels={pickerLabels}
          />
        ) : def.type === 'date' ? (
          <DateField
            id={def.name}
            value={value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            invalid={Boolean(error)}
            describedBy={describedBy}
            dict={dict}
            locale={locale}
            maxAge={MAX_AGE}
          />
        ) : def.type === 'tel' ? (
          <PhoneField
            {...shared}
            placeholder={copy.placeholder || undefined}
            dict={dict}
            locale={locale}
          />
        ) : def.type === 'textarea' ? (
          <textarea
            {...nativeProps}
            ref={registerRef}
            rows={3}
            className={`${INPUT} ${borderFor(Boolean(error), valid)} resize-y`}
          />
        ) : (
          <>
            <input
              {...nativeProps}
              ref={registerRef}
              type={def.type}
              inputMode={def.inputMode}
              className={`${INPUT} ${borderFor(Boolean(error), valid)} ${valid ? 'pr-11' : ''}`}
            />
            {/* Positive inline feedback, not just error feedback. */}
            {valid && (
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <CheckIcon />
              </span>
            )}
          </>
        )}
      </div>

      {/* Helper text sits below the control, not above it. Above, a hint on one
          half of a desktop pair pushes its input down and the two stop lining
          up; below, every control in a row starts at the same height. The
          aria-describedby link is unaffected by the visual order. */}
      {copy.hint && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {copy.hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 flex gap-1.5 text-sm text-state-error">
          <AlertIcon />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
