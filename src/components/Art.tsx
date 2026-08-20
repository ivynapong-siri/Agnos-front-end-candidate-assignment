import type { SectionId } from '@/lib/fields'

/**
 * Hand-authored illustrations. No illustration library, no raster assets — a
 * few dozen lines of SVG that inherit the Tailwind colour tokens, so the
 * artwork can never drift from the palette.
 *
 * Every piece is built from the Agnos mark's own geometry: a square rotated 45°
 * with rounded corners. That is literally the shape in the logo file, so the
 * illustrations and the logo share a motif for free.
 */

/** The logo's rounded-diamond mark, at any size and position. */
export function Mark({ cx, cy, size, className }: { cx: number; cy: number; size: number; className: string }) {
  const half = size / 2
  return (
    <g transform={`translate(${cx} ${cy}) rotate(45)`}>
      <rect x={-half} y={-half} width={size} height={size} rx={size * 0.28} className={className} />
    </g>
  )
}

/** Landing card: "I'm a patient" — a clipboard and pen. */
export function ArtPatient({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="52" className="fill-brand-wash" />
      <rect x="34" y="24" width="52" height="70" rx="10" className="fill-white stroke-brand" strokeWidth="2.5" />
      <rect x="48" y="18" width="24" height="12" rx="6" className="fill-brand" />
      <rect x="46" y="46" width="28" height="6" rx="3" className="fill-brand-tint" />
      <rect x="46" y="60" width="20" height="6" rx="3" className="fill-brand-tint" />
      <rect x="46" y="74" width="26" height="6" rx="3" className="fill-brand-wash" />
      <path d="M78 84l16-16" strokeWidth="7" strokeLinecap="round" className="stroke-brand" />
      <path d="M74 88l4-4 4 4-4 4z" className="fill-navy-900" />
      <Mark cx={96} cy={34} size={16} className="fill-brand-tint" />
    </svg>
  )
}

/** Landing card: "I'm staff" — a dashboard with a live pulse. */
export function ArtStaff({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="52" className="fill-brand-wash" />
      <rect x="24" y="30" width="72" height="52" rx="9" className="fill-white stroke-brand" strokeWidth="2.5" />
      <rect x="52" y="86" width="16" height="10" rx="3" className="fill-brand" />
      <rect x="40" y="96" width="40" height="6" rx="3" className="fill-brand" />
      <rect x="34" y="42" width="24" height="12" rx="4" className="fill-brand-tint" />
      <rect x="34" y="60" width="24" height="12" rx="4" className="fill-brand-wash" />
      <rect x="64" y="42" width="22" height="30" rx="4" className="fill-brand-wash" />
      <path
        d="M66 58h4l3-7 4 13 3-6h4"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-brand"
      />
      <circle cx="94" cy="34" r="8" className="animate-breathe fill-state-ok" />
    </svg>
  )
}

/** Post-submit confirmation. */
export function ArtDone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="52" className="fill-brand-wash" />
      <Mark cx={50} cy={60} size={54} className="fill-brand-tint" />
      <Mark cx={68} cy={60} size={54} className="fill-brand" />
      <path
        d="M56 62l7 7 14-15"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-white"
      />
    </svg>
  )
}

const SECTION_PATHS: Record<SectionId, string> = {
  // person
  personal: 'M12 11a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1',
  // handset + signal
  contact:
    'M7 3h3l2 5-2.5 1.5a11 11 0 005 5L16 12l5 2v3a2 2 0 01-2 2A16 16 0 015 5a2 2 0 012-2z',
  // globe
  background: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18',
}

export function SectionIcon({ id, className }: { id: SectionId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d={SECTION_PATHS[id]}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-brand"
      />
    </svg>
  )
}
