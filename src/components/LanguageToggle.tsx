'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, LOCALE_NAMES, type Dictionary, type Locale } from '@/i18n'

/**
 * Swaps the first path segment so the visitor stays on the page they were
 * reading. Plain links rather than a router push: the URL *is* the language, so
 * the choice should be shareable, bookmarkable and reachable with the back
 * button.
 *
 * The active pill is a single shared element carrying a layoutId, so Framer
 * animates it sliding between the two options instead of it disappearing from
 * one and reappearing on the other — a switch rather than a swap.
 */
export function LanguageToggle({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname()
  const rest = pathname.split('/').slice(2).join('/')
  const reduceMotion = useReducedMotion()

  return (
    <nav
      aria-label={dict.nav.languageLabel}
      className="relative flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-brand-wash"
    >
      {LOCALES.map((option) => {
        const active = option === locale
        return (
          <Link
            key={option}
            href={`/${option}${rest ? `/${rest}` : ''}`}
            hrefLang={option}
            aria-current={active ? 'true' : undefined}
            className="relative inline-flex min-h-11 items-center rounded-full px-3.5 py-1.5 text-sm font-semibold"
          >
            {active && (
              <motion.span
                layoutId="language-switch-pill"
                aria-hidden="true"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }
                }
                className="absolute inset-0 rounded-full bg-brand"
              />
            )}
            {/* Above the pill, and easing its own colour so the label turns
                white roughly as the pill arrives under it. */}
            <span className={`relative transition-colors duration-200 ${active ? 'text-white' : 'text-ink/70'}`}>
              {LOCALE_NAMES[option]}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
