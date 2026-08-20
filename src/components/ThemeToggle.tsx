'use client'

import { useSyncExternalStore } from 'react'
import type { Dictionary } from '@/i18n'

/**
 * Switches the high-contrast, colour-blind-safe palette on and off.
 *
 * The live value is an attribute on <html>, not React state, because an inline
 * script in the layout has to apply it before first paint to avoid a flash of
 * the wrong palette. useSyncExternalStore is how a component reads that kind of
 * outside-React value: it takes a separate server snapshot, so SSR and
 * hydration agree and there is no mismatch to suppress — and no setState in an
 * effect either.
 */

export const THEME_KEY = 'agnos.theme'
export const HIGH_CONTRAST = 'high-contrast'

/** Fires when this component changes the theme, so the store re-reads. */
const CHANGE_EVENT = 'agnos:themechange'

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => window.removeEventListener(CHANGE_EVENT, onChange)
}

const readTheme = () => document.documentElement.dataset.theme === HIGH_CONTRAST
const readServerTheme = () => false

function ContrastIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" strokeWidth="1.8" className="stroke-current" />
      {/* Half filled — the conventional contrast glyph. */}
      <path d="M12 3.5a8.5 8.5 0 000 17z" className="fill-current" />
    </svg>
  )
}

export function ThemeToggle({ dict }: { dict: Dictionary }) {
  const high = useSyncExternalStore(subscribe, readTheme, readServerTheme)

  const toggle = () => {
    const root = document.documentElement
    if (high) delete root.dataset.theme
    else root.dataset.theme = HIGH_CONTRAST

    try {
      localStorage.setItem(THEME_KEY, high ? '' : HIGH_CONTRAST)
    } catch {
      // Private browsing can refuse storage; the toggle still works for this page.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={high}
      title={dict.theme.hint}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        high ? 'bg-navy-900 text-white' : 'bg-white/50 text-navy-900 ring-1 ring-white/70 backdrop-blur-md'
      }`}
    >
      <ContrastIcon />
      {/* Visible from sm up: an icon alone says nothing, and a title attribute
          never appears on a touch device. Below sm there is no room beside the
          language switch, so it stays as the accessible name. */}
      <span className="hidden sm:inline">{dict.theme.label}</span>
      <span className="sr-only sm:hidden">{dict.theme.label}</span>
    </button>
  )
}
