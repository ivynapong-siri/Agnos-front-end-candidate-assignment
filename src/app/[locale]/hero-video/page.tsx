import type { Metadata } from 'next'
import { ArtPatient, ArtStaff } from '@/components/Art'
import { ChoiceCard } from '@/components/ChoiceCard'
import { HeroVideo } from '@/components/HeroVideo'
import { DEFAULT_LOCALE, getDictionary, isLocale } from '@/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE)
  // `absolute` opts out of the layout's "%s · site name" template, which
  // would otherwise render the site name twice.
  return { title: { absolute: dict.meta.siteTitle }, description: dict.meta.siteDescription }
}

/**
 * The same landing page with a looping video behind it, as an alternative to
 * the still folder hero. Both exist so they can be compared side by side; one
 * of them should eventually win and the other be deleted.
 *
 * The scrim is the whole problem with a video hero. Measured across the left
 * half of the footage, luminance swings from 56 to 221 — dark blue and near
 * white inside the same frame — so no single text colour survives unaided, and
 * a flat scrim strong enough to fix it (0.85+) washes the video out completely.
 * A left-to-right gradient solves both: opaque where the words are, clear where
 * the footage is worth seeing.
 */
export default async function HeroVideoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const dict = getDictionary(locale)

  return (
    <main className="w-full pb-16">
      <section className="relative isolate overflow-hidden">
        <HeroVideo className="absolute inset-0 h-full w-full object-cover object-center" />

        {/* Strong enough on the left that even `muted` at 4.5:1 holds over the
            darkest frame; gone by the right so the loop stays visible. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/40 lg:via-white/80 lg:to-transparent"
        />

        <div className="relative mx-auto grid max-w-6xl items-start gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:py-20">
          <div className="max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{dict.landing.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold text-navy-900 sm:text-4xl">{dict.landing.heading}</h1>
            <p className="mt-4 text-base text-ink/80">{dict.landing.body}</p>

            <ChoiceCard
              href={`/${locale}/patient`}
              art={ArtPatient}
              title={dict.landing.patientTitle}
              blurb={dict.landing.patientBlurb}
              cta={dict.landing.patientCta}
              className="mt-8"
            />
          </div>

          <div className="lg:pl-6 lg:pt-16">
            <ChoiceCard
              href={`/${locale}/staff`}
              art={ArtStaff}
              title={dict.landing.staffTitle}
              blurb={dict.landing.staffBlurb}
              cta={dict.landing.staffCta}
              className="lg:max-w-sm lg:-rotate-2 lg:hover:rotate-0"
            />
          </div>
        </div>
      </section>

      {/* Outside the video, on the plain background: centred over the middle of
          the footage it would sit where the scrim has faded out. */}
      <p className="mx-auto mt-8 max-w-6xl px-6 text-center text-xs text-muted">{dict.landing.footnote}</p>
    </main>
  )
}
