import Image from 'next/image'
import Link from 'next/link'
import type { Dictionary, Locale } from '@/i18n'

/**
 * The frame all three staff screens share: form on the left, the folder artwork
 * on the right with three cards floating over it.
 *
 * The reference design put customer testimonials in those cards. They are gone
 * — inventing three people and three quotes for a clinic's login screen would
 * be fabricated praise presented as real. The cards say what the desk view
 * actually does instead, which is both true and more use to someone deciding
 * whether to sign in.
 *
 * A server component: nothing here has state, so the only JavaScript on these
 * routes is the form itself.
 */
export function AuthShell({
  title,
  description,
  locale,
  dict,
  children,
}: {
  title: string
  description: string
  locale: Locale
  dict: Dictionary
  children: React.ReactNode
}) {
  const points = [
    { title: dict.auth.points.oneTitle, body: dict.auth.points.oneBody },
    { title: dict.auth.points.twoTitle, body: dict.auth.points.twoBody },
    { title: dict.auth.points.threeTitle, body: dict.auth.points.threeBody },
  ]

  return (
    // -mt cancels the spacer the fixed header leaves, so the two columns sit
    // against the top of the viewport rather than below a reserved strip.
    <main className="-mt-16 pt-16 sm:-mt-20 sm:pt-20">
      {/* The same shell as the header and every other page, so the form starts
          on the logo's line. Centring this column inside the viewport put it
          39px off the header — small, but it moved on every navigation. */}
      <div className="page-shell grid items-center gap-10 py-10 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-2 lg:gap-16">
        <section className="w-full max-w-md">
          <p
            className="enter enter-eyebrow text-xs font-bold uppercase tracking-[0.18em] text-brand"
          >
            {dict.auth.badge}
          </p>
          <h1 className="enter enter-heading mt-3 text-3xl font-bold text-navy-900 sm:text-4xl">
            {title}
          </h1>
          <p className="enter enter-body mt-3 text-base text-ink/80">{description}</p>

          {children}

          {/* Stated plainly rather than in the small print. Someone who believes
              this login protects the patient list would be wrong, and that is a
              worse outcome than admitting the demo is a demo. */}
          <p
            className="enter mt-8 rounded-2xl border border-brand-wash bg-brand-wash/50 p-4 text-xs leading-relaxed text-ink/80"
            style={{ ['--enter-delay' as string]: '900ms' }}
          >
            {dict.auth.demoNotice}
          </p>

          <p
            className="enter mt-6 text-center text-sm text-muted"
            style={{ ['--enter-delay' as string]: '950ms' }}
          >
            <Link
              href={`/${locale}`}
              className="inline-flex min-h-11 items-center rounded px-1 font-semibold text-brand underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {dict.nav.home}
            </Link>
          </p>
        </section>

        {/*
        Hidden below lg for the same reason as the landing hero: the art is a
        2.4:1 banner and on a narrow screen it crops to an empty white field.

        Pinned to the viewport rather than stretched to the form's height. Left
        to fill the column it reached 840px on the sign-in page and 1205px on
        registration, turning a wide banner into a narrow vertical slice — most
        of the picture cropped away, and a different crop on each of the three
        screens. Sticky keeps one composition at one height however long the
        form is, and object-right picks the half the artwork actually lives in,
        the same choice the landing page makes.
      */}
        <section className="relative hidden lg:block lg:h-[calc(100svh-9rem)]">
          <div className="relative h-full overflow-hidden rounded-3xl">
          <Image
            src="/hero-folder.jpg"
            alt=""
            fill
            priority
            quality={85}
            sizes="(min-width: 1024px) 50vw, 0px"
            /*
              81%, not `right`. The box is portrait, so cover shows only about a
              third of a 2.35:1 banner, and pinning the right edge framed
              67%-100% — a third of the panel spent on the empty margin past the
              folder, with the subject shoved against the left.

              Sampling the source column by column put the artwork at 56%-88%
              and densest at 77%, which argued for 87%. 81% is where it was
              settled by eye on the page, and that wins: the density heuristic
              measures ink, not composition, and the folder reads better with a
              little room on its right than centred on its centre of mass.
            */
            className="pointer-events-none select-none object-cover object-[81%_center]"
          />

          {/* Capped: at the full column width these ran to 624px, which is a
              long line for two lines of small type. */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6">
              {points.map((point, index) => (
                <div
                  key={point.title}
                  className="glass-card enter max-w-xs p-4"
                  style={{ ['--enter-delay' as string]: `${700 + index * 120}ms` }}
                >
                  <p className="text-sm font-bold text-navy-900">{point.title}</p>
                  <p className="mt-1 text-xs text-ink/80">{point.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
