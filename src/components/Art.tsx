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
function Mark({ cx, cy, size, className }: { cx: number; cy: number; size: number; className: string }) {
  const half = size / 2
  return (
    <g transform={`translate(${cx} ${cy}) rotate(45)`}>
      <rect x={-half} y={-half} width={size} height={size} rx={size * 0.28} className={className} />
    </g>
  )
}

/** Landing hero: a patient form on the left, the staff dashboard on the right, live in between. */
export function ArtSync({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 200" fill="none" className={className} aria-hidden="true">
      <circle cx="74" cy="62" r="58" className="fill-brand-wash" opacity="0.75" />
      <circle cx="288" cy="142" r="64" className="fill-brand-wash" opacity="0.55" />

      <Mark cx={158} cy={40} size={22} className="fill-brand-tint" />
      <Mark cx={172} cy={40} size={22} className="fill-brand" />

      {/* patient device */}
      <rect x="34" y="30" width="96" height="140" rx="14" className="fill-white stroke-brand-wash" strokeWidth="2" />
      <rect x="50" y="52" width="64" height="7" rx="3.5" className="fill-brand-wash" />
      <rect x="50" y="70" width="44" height="7" rx="3.5" className="fill-brand-wash" />
      <rect x="50" y="88" width="56" height="7" rx="3.5" className="fill-brand-wash" />
      <rect x="50" y="104" width="64" height="20" rx="7" className="fill-brand-wash stroke-brand" strokeWidth="1.5" />
      <rect x="57" y="109" width="2" height="10" rx="1" className="animate-breathe fill-brand" />
      <rect x="50" y="140" width="64" height="16" rx="8" className="fill-brand" />

      {/* the live link */}
      <path d="M134 100h58" strokeDasharray="5 6" strokeWidth="2" strokeLinecap="round" className="stroke-brand-tint" />
      {[148, 164, 180].map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy="100"
          r="3.5"
          className="animate-breathe fill-brand"
          style={{ animationDelay: `${i * 0.28}s` }}
        />
      ))}

      {/* staff dashboard */}
      <rect x="196" y="48" width="132" height="104" rx="14" className="fill-white stroke-brand-wash" strokeWidth="2" />
      <rect x="210" y="62" width="46" height="7" rx="3.5" className="fill-navy-900" opacity="0.75" />
      <circle cx="314" cy="65" r="4" className="animate-breathe fill-state-ok" />
      <rect x="210" y="82" width="104" height="12" rx="6" className="fill-brand-wash" />
      <rect x="210" y="82" width="4" height="12" rx="2" className="fill-brand" />
      <rect x="210" y="102" width="88" height="12" rx="6" className="fill-brand-wash" />
      <rect x="210" y="122" width="96" height="12" rx="6" className="fill-brand-wash" />
    </svg>
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

/** Staff dashboard, nobody filling anything in yet. */
export function ArtWaiting({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className} aria-hidden="true">
      <circle cx="100" cy="70" r="58" className="fill-brand-wash" opacity="0.7" />
      <Mark cx={92} cy={44} size={30} className="fill-brand-tint" />
      <Mark cx={110} cy={44} size={30} className="fill-brand" />
      {[0, 1, 2].map((row) => (
        <rect
          key={row}
          x={52 + row * 6}
          y={80 + row * 16}
          width={96 - row * 12}
          height="11"
          rx="5.5"
          strokeDasharray="6 6"
          strokeWidth="2"
          className="stroke-brand-tint"
        />
      ))}
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
