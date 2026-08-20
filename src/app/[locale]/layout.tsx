import type { Metadata, Viewport } from 'next'
import { Anuphan } from 'next/font/google'
import Link from 'next/link'
import { ContactCard } from '@/components/ContactCard'
import { LanguageToggle } from '@/components/LanguageToggle'
import { PageTransition } from '@/components/PageTransition'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/Logo'
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
        {/* Applies the stored palette before the rest of the body paints, so a
            high-contrast user never sees a flash of the default one. Inline and
            blocking on purpose — a component cannot run early enough. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('agnos.theme')==='high-contrast')document.documentElement.dataset.theme='high-contrast'}catch(e){}",
          }}
        />
        {/* Soft brand wash behind everything. Blurred CSS circles rather than
            SVG blobs: same look, nothing to maintain. */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-wash opacity-80 blur-3xl" />
          <div className="absolute -bottom-48 -right-32 h-[26rem] w-[26rem] rounded-full bg-brand-tint/25 blur-3xl" />
        </div>

        <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-5 sm:px-6">
          <Link
            href={`/${locale}`}
            aria-label={dict.nav.home}
            className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <Logo className="h-9 w-auto" />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle dict={dict} />
            <LanguageToggle locale={locale} dict={dict} />
          </div>
        </header>

        {/* The header sits outside the transition so the logo and the language
            toggle stay put while the page beneath them crossfades. */}
        <PageTransition>{children}</PageTransition>

        {/* Bottom-right on every page, so a patient stuck on a field never has
            to go looking for how to ask. */}
        <ContactCard dict={dict} />
      </body>
    </html>
  )
}
