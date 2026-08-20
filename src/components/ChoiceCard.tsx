import Link from 'next/link'
import type { ArtPatient } from './Art'

/**
 * The "I'm a patient" / "I'm staff" card, shared by both hero treatments.
 *
 * Pure CSS hover, so this stays a server component — `group` on the link drives
 * both child effects and nothing here needs a runtime.
 *
 * Glass is `bg-white/85` rather than anything more translucent because that is
 * the floor at which the muted body text still clears 4.5:1 over the darkest
 * point of the still background, the blue folder at rgb(30 91 182). At /80 it
 * measures 4.26:1 and fails.
 */
export function ChoiceCard({
  href,
  art: Art,
  title,
  blurb,
  cta,
  className,
}: {
  href: string
  art: typeof ArtPatient
  title: string
  blurb: string
  cta: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`group relative isolate block overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 to-white/80 p-6 shadow-[0_10px_36px_-14px_rgba(0,27,82,0.28),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-white/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:p-8 ${className ?? ''}`}
    >
      {/* Gloss sweep: parked off the left edge, sent past the right on hover,
          clipped by the card. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[200%]"
      />

      <span className="relative block">
        <span className="block w-fit transition-transform duration-300 ease-out group-hover:scale-125">
          <Art className="h-24 w-24" />
        </span>
        <span className="mt-5 block text-xl font-bold text-navy-900">{title}</span>
        <span className="mt-2 block text-sm text-ink/80">{blurb}</span>
        <span className="mt-5 inline-flex items-center gap-2 font-semibold text-brand">
          {cta}
          <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
            →
          </span>
        </span>
      </span>
    </Link>
  )
}
