import type { Metadata, Viewport } from 'next'
import { Anuphan } from 'next/font/google'
import Link from 'next/link'
import Script from 'next/script'
import { ContactCard } from '@/components/ContactCard'
import { LanguageToggle } from '@/components/LanguageToggle'
import { PageTransition } from '@/components/PageTransition'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/Logo'
import { CanvasTint } from '@/components/CanvasTint'
import { DEFAULT_LOCALE, LOCALES, getDictionary, isLocale } from '@/i18n'
import '../globals.css'

/**
 * This is the root layout: there is no app/layout.tsx, because the language has
 * to be known before <html lang> is written. Putting the locale in the route
 * means the server renders the right language in the first byte of HTML — no
 * flash of the wrong language, and nothing for hydration to disagree about.
 */

// One typeface for both scripts. Anuphan is drawn as a Thai/Latin pair, so the
// two share metrics instead of being two fonts of different apparent size
// stacked on each other.
const anuphan = Anuphan({
  subsets: ['latin', 'thai'],
  variable: '--font-anuphan',
  display: 'swap',
})

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

/** Only th and en exist; anything else 404s at build time. */
export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE)
  return {
    title: { default: dict.meta.siteTitle, template: `%s · ${dict.meta.siteTitle}` },
    description: dict.meta.siteDescription,
  }
}

export const viewport: Viewport = {
  themeColor: '#1A59C2',
  width: 'device-width',
  initialScale: 1,
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const dict = getDictionary(locale)

  return (
    <html lang={locale} className={anuphan.variable}>
      <body>
        {/*
          Applies the stored palette before the page paints, so a high-contrast
          user never sees a flash of the default one.

          An external file, not an inline script: React 19 does not render a
          script element's text children on the client, so inline code is in the
          server HTML and gone after hydration — React reports that as a text
          mismatch and hydration fails. Moving the code out of the element
          removes the mismatched text entirely.
        */}
        <Script id="agnos-theme" src="/theme.js" strategy="beforeInteractive" />

        {/* Soft brand wash behind everything. Blurred CSS circles rather than
            SVG blobs: same look, nothing to maintain. */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="enter-shape absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-wash opacity-80 blur-3xl" />
          <div
            className="enter-shape absolute -bottom-48 -right-32 h-[26rem] w-[26rem] rounded-full bg-brand-tint/25 blur-3xl"
            style={{ ["--drift-duration" as string]: "6.5s" }}
          />
        </div>

        <CanvasTint />

        <header className="enter enter-header fixed inset-x-0 top-0 z-50 bg-white/35 backdrop-blur-2xl backdrop-saturate-150">
          {/* Out of the flow, so a full-screen background runs underneath it.
              No band — just a veil and a blur. 35% is the floor at which the
              navy labels still clear 4.5:1 over the worst thing that can pass
              beneath: the blue submit button. */}
          <div className="page-shell flex h-16 flex-nowrap items-center gap-3 sm:h-20">
          <Link
            href={`/${locale}`}
            aria-label={dict.nav.home}
            className="inline-flex min-h-11 items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <Logo className="h-9 w-auto" />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle dict={dict} />
            <LanguageToggle locale={locale} dict={dict} />
          </div>
          </div>
        </header>

        {/* The header sits outside the transition so the logo and the language
            toggle stay put while the page beneath them crossfades. */}
        <div className="pt-16 sm:pt-20">
          <PageTransition>{children}</PageTransition>
        </div>

        {/* Bottom-right on every page, so a patient stuck on a field never has
            to go looking for how to ask. */}
        <ContactCard dict={dict} />
      </body>
    </html>
  )
}
