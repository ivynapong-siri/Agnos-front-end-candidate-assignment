import Image from 'next/image'
import { ArtPatient, ArtStaff } from '@/components/Art'
import { ChoiceCard } from '@/components/ChoiceCard'
import { DEFAULT_LOCALE, getDictionary, isLocale } from '@/i18n'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const dict = getDictionary(locale)

  return (
    <main className="w-full pb-16">
      {/* Full-bleed: the section spans the viewport while the content inside
          stays on the same max-w-6xl measure as the rest of the app. */}
      <section className="relative isolate overflow-hidden sm:-mt-20 sm:pt-20">
        {/*
          next/image rather than a CSS background: same result visually
          (object-cover / object-right is bg-cover / bg-right), but it serves
          AVIF and WebP sized to the viewport. The full 3168px source is kept so
          there is headroom for 2x displays — it is never sent as-is, Next
          resizes on request, and a 1280px viewport pulls a 1920px variant.

          Hidden below lg. The art is a 2.4:1 banner with everything of interest
          on the right — on a phone it would crop to an empty white field.
        */}
        <Image
          src="/hero-folder.jpg"
          alt=""
          fill
          priority
          quality={85}
          sizes="(min-width: 1024px) 100vw, 0px"
          className="pointer-events-none hidden select-none object-cover object-right lg:block"
        />

        {/* Both cards are placed in the same grid row, so they line up however
            tall the headline above happens to run. */}
        <div className="relative mx-auto grid max-w-6xl gap-x-10 gap-y-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2 lg:px-8 lg:py-16">
          <div className="max-w-md lg:col-start-1 lg:row-start-1">
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

        <p className="relative mx-auto max-w-6xl px-6 pb-10 text-center text-xs text-muted">{dict.landing.footnote}</p>
      </section>
    </main>
  )
}
