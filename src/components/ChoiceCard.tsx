import Link from 'next/link'
import type { ArtPatient } from './Art'

/**
 * The "I'm a patient" / "I'm staff" card, shared by both hero treatments.
 *
 * Pure CSS hover, so this stays a server component — `group` on the link drives
 * both child effects and nothing here needs a runtime.
 *
 * The glass itself is the shared `.glass-card` treatment, the same material as
 * GlassButton, so the cards and the buttons cannot drift apart. Its fill bottoms
 * out at 0.8, which is the floor at which the body text still clears 4.5:1 over
 * the darkest point of the background, the blue folder at rgb(30 91 182).
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
      className={`glass-card group flex flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:p-8 ${className ?? ''}`}
    >
      {/* Gloss sweep: parked off the left edge, sent past the right on hover,
          clipped by the card. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[200%]"
      />

      <span className="relative flex flex-1 flex-col">
        <span className="block w-fit transition-transform duration-300 ease-out group-hover:scale-125">
          <Art className="h-24 w-24" />
        </span>
        <span className="mt-5 block text-xl font-bold text-navy-900">{title}</span>
        <span className="mt-2 block text-sm text-ink/80">{blurb}</span>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 font-semibold text-brand">
          {cta}
          <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
            →
          </span>
        </span>
      </span>
    </Link>
  )
}
