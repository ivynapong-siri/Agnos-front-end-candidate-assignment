'use client'

import type { Dictionary } from '@/i18n'

/**
 * "Fill it in for me."
 *
 * The point of these screens is the screens, not the typing. A reviewer opening
 * the sign-in page should be one tick and one click from the desk view, and
 * should never have to guess a password — so the credentials are also printed
 * under the box rather than hidden in a README.
 *
 * Unticking clears the fields again, which is what makes it a checkbox rather
 * than a button: the state is visible and reversible.
 */
export function SampleFill({
  checked,
  onChange,
  hint,
  dict,
  delayMs = 0,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  hint?: string
  dict: Dictionary
  delayMs?: number
}) {
  return (
    <div className="enter" style={{ ['--enter-delay' as string]: `${delayMs}ms` }}>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-line accent-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
        <span className="text-sm font-semibold text-navy-900">{dict.auth.fillSample}</span>
      </label>
      <p className="ml-8 text-xs text-muted">{hint ?? dict.auth.fillSampleHint}</p>
    </div>
  )
}
