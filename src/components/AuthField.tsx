'use client'

import { forwardRef, useId, useState } from 'react'
import type { Dictionary } from '@/i18n'

/**
 * A labelled text input for the staff auth screens.
 *
 * Deliberately the same shape and the same class string as the intake form's
 * inputs (Field.tsx) rather than a second look for a second flow — a patient and
 * a receptionist are typing into the same product.
 *
 * Password fields get a reveal toggle. It is a real <button> with an accessible
 * name that changes with the state, not an icon with a title attribute, so a
 * screen reader announces which way it will go.
 */

const INPUT =
  'w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-ink transition-colors ' +
  'placeholder:text-muted focus:outline-none focus:shadow-ring'

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-current"
      />
      <circle cx="12" cy="12" r="3" strokeWidth="1.8" className="stroke-current" />
      {/* The slash is the whole difference between the two states, so it is the
          only thing that changes rather than swapping in a second icon. */}
      {!open && (
        <path d="M4 20 20 4" strokeWidth="1.8" strokeLinecap="round" className="stroke-current" />
      )}
    </svg>
  )
}

type Props = {
  label: string
  type?: 'text' | 'email' | 'password'
  error?: string
  hint?: string
  autoComplete?: string
  dict: Dictionary
  delayMs?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>

export const AuthField = forwardRef<HTMLInputElement, Props>(function AuthField(
  { label, type = 'text', error, hint, autoComplete, dict, delayMs = 0, ...input },
  ref,
) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ')

  return (
    <div
      className="enter"
      style={{ ['--enter-delay' as string]: `${delayMs}ms`, ['--enter-duration' as string]: '520ms' }}
    >
      <label htmlFor={id} className="block text-sm font-semibold text-navy-900">
        {label}
      </label>

      <div className="relative mt-1.5">
        <input
          {...input}
          ref={ref}
          id={id}
          type={isPassword && revealed ? 'text' : type}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`${INPUT} ${isPassword ? 'pr-12' : ''} ${
            error ? 'border-state-error' : 'border-line hover:border-brand focus:border-brand'
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((was) => !was)}
            // 44px hit area inside a 48px field, which is the touch floor the
            // rest of the app holds to.
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span className="sr-only">{revealed ? dict.auth.hidePassword : dict.auth.showPassword}</span>
            <EyeIcon open={revealed} />
          </button>
        )}
      </div>

      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-state-error">
          {error}
        </p>
      )}
    </div>
  )
})
