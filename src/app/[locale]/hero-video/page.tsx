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
  // `absolute` opts out of the layout's "%s · site name" template, which would
  // otherwise render the site name twice.
  return { title: { absolute: dict.meta.siteTitle }, description: dict.meta.siteDescription }
}

/**
 * The landing page with the clip playing behind it, as an alternative to the
 * still folder hero.
 *
 * Full screen: `-mt-16` cancels the spacer the fixed header leaves behind and
 * `min-h-svh` fills the viewport, so the video runs edge to edge and passes
 * under the menu instead of starting below a reserved strip. `svh` rather than
 * `vh` because mobile browsers measure `vh` against the retracted address bar,
 * which leaves a gap at the bottom on first paint.
 *
 * There is no scrim over the video at all. Dimming the whole frame to protect
 * one paragraph is a bad trade — it costs the footage everything and buys
 * legibility only where the words happen to sit. The text has its own glass
 * panel instead, so the video stays completely clear and the copy still clears
 * 4.5:1 over the darkest frame.
 */
export default async function HeroVideoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const dict = getDictionary(locale)

  return (
    <main className="-mt-16 sm:-mt-20">
      <section className="relative isolate flex min-h-svh flex-col overflow-hidden pt-16 sm:pt-20">
        <HeroVideo className="absolute inset-0 -z-10 h-full w-full object-cover object-center" />

        <div className="mx-auto grid w-full max-w-6xl flex-1 content-center gap-x-10 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          {/*
            The panel is what makes a clear video possible. At /90 the muted body
            text holds about 5:1 over the darkest pixel in the footage
            (rgb 15 60 141); with nothing behind it, it would be 1.6:1.
          */}
          <div className="max-w-md rounded-3xl bg-white/90 p-6 shadow-card ring-1 ring-white/70 backdrop-blur-xl sm:p-8 lg:col-start-1 lg:row-start-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{dict.landing.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold text-navy-900 sm:text-4xl">{dict.landing.heading}</h1>
            <p className="mt-4 text-base text-ink/80">{dict.landing.body}</p>
          </div>

          <ChoiceCard
            href={`/${locale}/patient`}
            art={ArtPatient}
            title={dict.landing.patientTitle}
            blurb={dict.landing.patientBlurb}
            cta={dict.landing.patientCta}
            className="lg:col-start-1 lg:row-start-2"
          />

          <ChoiceCard
            href={`/${locale}/staff`}
            art={ArtStaff}
            title={dict.landing.staffTitle}
            blurb={dict.landing.staffBlurb}
            cta={dict.landing.staffCta}
            className="lg:col-start-2 lg:row-start-2 lg:max-w-sm"
          />
        </div>

        {/* Inside the section, floating on the video like the header, rather
            than pushing the background up to make room for itself. */}
        <p className="mx-auto w-full max-w-6xl px-6 pb-8 text-center">
          <span className="inline-block rounded-full bg-white/85 px-4 py-2 text-xs text-navy-900 backdrop-blur">
            {dict.landing.footnote}
          </span>
        </p>
      </section>
    </main>
  )
}
