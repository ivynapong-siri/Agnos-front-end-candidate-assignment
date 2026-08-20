'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, LOCALE_NAMES, type Dictionary, type Locale } from '@/i18n'

/**
 * Swaps the first path segment so the visitor stays on the page they were
 * reading. Plain links rather than a router push: the URL *is* the language, so
 * the choice should be shareable, bookmarkable and reachable with the back
 * button.
 */
export function LanguageToggle({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname()
  const rest = pathname.split('/').slice(2).join('/')

  return (
    <nav
      aria-label={dict.nav.languageLabel}
      className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-brand-wash"
    >
      {LOCALES.map((option) => {
        const active = option === locale
        return (
          <Link
            key={option}
            href={`/${option}${rest ? `/${rest}` : ''}`}
            hrefLang={option}
            aria-current={active ? 'true' : undefined}
            className={`inline-flex min-h-11 items-center rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              active ? 'bg-brand text-white' : 'text-ink/70 hover:bg-brand-wash hover:text-brand'
            }`}
          >
            {LOCALE_NAMES[option]}
          </Link>
        )
      })}
    </nav>
  )
}
