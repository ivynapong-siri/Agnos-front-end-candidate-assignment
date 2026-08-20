import Image from 'next/image'
import { ArtPatient, ArtStaff } from '@/components/Art'
import { ChoiceCard } from '@/components/ChoiceCard'
import { DEFAULT_LOCALE, getDictionary, isLocale } from '@/i18n'

/**
 * The landing page over the still folder artwork.
 *
 * Full screen, the same way the video variant is: `-mt-16` cancels the spacer
 * the fixed header leaves behind and `min-h-svh` fills the viewport, so the
 * artwork runs edge to edge and passes under the menu rather than starting
 * below a reserved strip.
 *
 * No scrim here either. The left half of this image is near-white — measured
 * between 241 and 254 — so the headline sits on it at better than 15:1 with
 * nothing in between, and the cards carry their own glass where the artwork
 * turns blue.
 */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const dict = getDictionary(locale)

  return (
    <main className="-mt-16 sm:-mt-20">
      <section className="relative isolate flex min-h-svh flex-col overflow-hidden pt-16 sm:pt-20">
        {/*
          next/image rather than a CSS background: identical result
          (object-cover / object-right is bg-cover / bg-right) but it serves
          AVIF and WebP sized to the viewport. The full 3168px source is kept
          for headroom on 2x displays — it is never sent as-is.

          Hidden below lg: the art is a 2.4:1 banner with everything of interest
          on the right, and on a phone it crops to an empty white field.
        */}
        <Image
          src="/hero-folder.jpg"
          alt=""
          fill
          priority
          quality={85}
          sizes="(min-width: 1024px) 100vw, 0px"
          className="pointer-events-none -z-10 hidden select-none object-cover object-right lg:block"
        />

        <div className="mx-auto grid w-full max-w-6xl flex-1 content-center gap-x-10 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
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

        {/* Inside the section, floating on the artwork rather than pushing it
            up to make room. */}
        <p className="mx-auto w-full max-w-6xl px-6 pb-8 text-center text-xs text-muted">
          {dict.landing.footnote}
        </p>
      </section>
    </main>
  )
}
