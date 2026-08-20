'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import type { FieldDef } from '@/lib/fields'
import type { PatientForm } from '@/lib/schema'

/**
 * One component for all seven input shapes. Reading the shape from the field
 * manifest means adding a field is a data change, not a JSX change.
 *
 * Accessibility contract, since this is the only place it can be enforced:
 *   - every control has a real <label for>, never a placeholder as its label
 *   - aria-invalid + aria-describedby wire the error to the control
 *   - errors are announced via role="alert"
 *   - hit area is 48px tall, above the 44px touch-target floor
 */

const CONTROL =
  'w-full rounded-xl border-2 bg-white px-4 py-3 text-base leading-6 text-ink transition-colors ' +
  'placeholder:text-muted focus:outline-none focus:shadow-ring'

const CONTROL_STATE = {
  idle: 'border-brand-wash hover:border-brand-tint focus:border-brand',
  error: 'border-state-error focus:border-state-error',
  ok: 'border-state-ok/40 focus:border-brand',
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <path d="M3 8.5l3.2 3.2L13 5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="stroke-state-ok" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.6" strokeWidth="1.6" className="stroke-state-error" />
      <path d="M8 4.8v4.1M8 11.4h.01" strokeWidth="1.8" strokeLinecap="round" className="stroke-state-error" />
    </svg>
  )
}

export function Field({ def }: { def: FieldDef }) {
  const {
    register,
    control,
    formState: { errors, touchedFields },
  } = useFormContext<PatientForm>()

  const value = useWatch({ control, name: def.name }) ?? ''
  const error = errors[def.name]?.message as string | undefined
  const touched = Boolean(touchedFields[def.name])
  const valid = !error && touched && value.trim() !== ''

  const hintId = def.hint ? `${def.name}-hint` : undefined
  const errorId = error ? `${def.name}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const listId = def.type === 'combo' ? `${def.name}-options` : undefined

  const shared = {
    id: def.name,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    'aria-required': def.required || undefined,
    className: `${CONTROL} ${error ? CONTROL_STATE.error : valid ? CONTROL_STATE.ok : CONTROL_STATE.idle}`,
    ...register(def.name),
  }

  return (
    <div>
      <label htmlFor={def.name} className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-navy-900">
        {def.label}
        {/* Mark what can be skipped, not what is mandatory: on a form that is
            mostly required, a wall of asterisks tells the patient nothing. */}
        {!def.required && <span className="text-xs font-normal text-muted">optional</span>}
      </label>

      <div className="relative">
        {def.type === 'select' ? (
          <select {...shared} className={`${shared.className} appearance-none pr-11`}>
            <option value="">Please choose…</option>
            {def.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : def.type === 'textarea' ? (
          <textarea
            {...shared}
            rows={3}
            maxLength={def.maxLength}
            placeholder={def.placeholder}
            autoComplete={def.autoComplete}
            className={`${shared.className} resize-y`}
          />
        ) : (
          <input
            {...shared}
            type={def.type === 'combo' ? 'text' : def.type}
            list={listId}
            inputMode={def.inputMode}
            maxLength={def.maxLength}
            placeholder={def.placeholder}
            autoComplete={def.autoComplete}
            className={`${shared.className} ${valid ? 'pr-11' : ''}`}
          />
        )}

        {def.type === 'select' && (
          <svg
            viewBox="0 0 16 16"
            className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            fill="none"
            aria-hidden="true"
          >
            <path d="M3.5 6L8 10.5 12.5 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-brand" />
          </svg>
        )}

        {/* Positive inline feedback, not just error feedback. */}
        {valid && def.type !== 'select' && def.type !== 'textarea' && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            <CheckIcon />
          </span>
        )}
      </div>

      {/* Helper text sits below the control, not above it. Above, a hint on one
          half of a desktop pair pushes its input down and the two stop lining
          up; below, every control in a row starts at the same height. The
          aria-describedby link is unaffected by the visual order. */}
      {def.hint && (
        <p id={hintId} className="mt-1.5 text-xs leading-5 text-muted">
          {def.hint}
        </p>
      )}

      {listId && (
        <datalist id={listId}>
          {def.options?.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 flex gap-1.5 text-sm leading-5 text-state-error">
          <AlertIcon />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
