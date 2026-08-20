import Link from 'next/link'
import { ArtPatient, ArtStaff, ArtSync } from '@/components/Art'
import { DEFAULT_LOCALE, getDictionary, isLocale } from '@/i18n'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const dict = getDictionary(locale)

  const choices = [
    {
      href: `/${locale}/patient`,
      art: ArtPatient,
      title: dict.landing.patientTitle,
      blurb: dict.landing.patientBlurb,
      cta: dict.landing.patientCta,
    },
    {
      href: `/${locale}/staff`,
      art: ArtStaff,
      title: dict.landing.staffTitle,
      blurb: dict.landing.staffBlurb,
      cta: dict.landing.staffCta,
    },
  ]

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-4 sm:px-6 sm:pt-8">
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{dict.landing.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold text-navy-900 sm:text-4xl">{dict.landing.heading}</h1>
          <p className="mt-4 max-w-md text-base text-ink/80">{dict.landing.body}</p>
        </div>
        <ArtSync className="w-full max-w-lg justify-self-center" />
      </section>

      <section className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2">
        {choices.map(({ href, art: Art, title, blurb, cta }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-3xl border border-brand-wash bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:p-8"
          >
            <Art className="h-24 w-24" />
            <h2 className="mt-5 text-xl font-bold text-navy-900">{title}</h2>
            <p className="mt-2 text-sm text-ink/75">{blurb}</p>
            <span className="mt-5 inline-flex items-center gap-2 font-semibold text-brand">
              {cta}
              <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
                →
              </span>
            </span>
          </Link>
        ))}
      </section>

      <p className="mt-10 text-center text-xs text-muted">{dict.landing.footnote}</p>
    </main>
  )
}
