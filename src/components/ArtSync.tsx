'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Mark } from './Art'

/**
 * The landing hero: a patient form on the left, the staff dashboard on the
 * right, and the sync happening between them.
 *
 * Four animations, all driven from one CYCLE constant so they read as a single
 * choreographed loop rather than four things that happen to be moving:
 *
 *   1. dots shuttling along the dashed line — the data in flight
 *   2. a typewriter in the form's active field — type, hold, delete, hold
 *   3. the two logo marks merging as the dots arrive, then parting
 *   4. a radar ping on the dashboard's live indicator
 *
 * Points 1 and 3 share the same duration and easing with no offset, so the
 * marks reach full overlap exactly when the dots reach the dashboard.
 *
 * Its own file, and a client component, so the other illustrations stay
 * server-rendered — only the hero needs the runtime.
 */

/** One full loop. Everything below is expressed as a fraction of this. */
const CYCLE = 3.2

/** Dot travel along the dashed line, in viewBox units. */
const TRAVEL = 40

/** Half the gap between the two marks, so each one moves this far to overlap. */
const MERGE = 7

// Typing keyframes. Stepping the width in ~6-unit jumps at roughly 160ms each
// reads as characters appearing, without needing real text at this scale.
const TYPED_WIDTHS = [0, 6, 12, 18, 24, 30, 36, 42, 42, 42, 30, 18, 6, 0, 0]
const TYPED_TIMES = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.45, 0.55, 0.62, 0.7, 0.78, 0.85, 1]
const CARET_X = 57

export function ArtSync({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()

  const loop = (extra: Record<string, unknown> = {}) => ({
    duration: CYCLE,
    repeat: Infinity,
    ease: 'easeInOut' as const,
    ...extra,
  })

  // With motion reduced, everything renders in its resting state: the dots sit
  // on the line, the marks stay apart, the field shows a typed value.
  const still = reduceMotion

  return (
    <svg viewBox="0 0 360 200" fill="none" className={className} aria-hidden="true">
      <circle cx="74" cy="62" r="58" className="fill-brand-wash" opacity="0.75" />
      <circle cx="288" cy="142" r="64" className="fill-brand-wash" opacity="0.55" />

      {/* 3 — the marks merge as the data lands, then separate again */}
      <motion.g
        animate={still ? undefined : { x: [0, MERGE, 0] }}
        transition={still ? undefined : loop()}
      >
        <Mark cx={158} cy={40} size={22} className="fill-brand-tint" />
      </motion.g>
      <motion.g
        animate={still ? undefined : { x: [0, -MERGE, 0] }}
        transition={still ? undefined : loop()}
      >
        <Mark cx={172} cy={40} size={22} className="fill-brand" />
      </motion.g>

      {/* patient device */}
      <rect x="34" y="30" width="96" height="140" rx="14" className="fill-white stroke-brand-wash" strokeWidth="2" />
      <rect x="50" y="52" width="64" height="7" rx="3.5" className="fill-brand-wash" />
      <rect x="50" y="70" width="44" height="7" rx="3.5" className="fill-brand-wash" />
      <rect x="50" y="88" width="56" height="7" rx="3.5" className="fill-brand-wash" />

      {/* 2 — the active field, typing itself out and clearing */}
      <rect x="50" y="104" width="64" height="20" rx="7" className="fill-brand-wash stroke-brand" strokeWidth="1.5" />
      <motion.rect
        x={CARET_X}
        y="112"
        height="4"
        rx="2"
        className="fill-brand"
        initial={{ width: still ? 30 : 0 }}
        animate={still ? undefined : { width: TYPED_WIDTHS }}
        transition={still ? undefined : loop({ times: TYPED_TIMES, ease: 'linear' })}
      />
      <motion.rect
        y="109"
        width="1.6"
        height="10"
        rx="0.8"
        className="fill-brand"
        initial={{ x: still ? CARET_X + 32 : CARET_X }}
        animate={still ? undefined : { x: TYPED_WIDTHS.map((w) => CARET_X + w + 2), opacity: [1, 1, 0, 0, 1] }}
        transition={
          still
            ? undefined
            : {
                x: loop({ times: TYPED_TIMES, ease: 'linear' }),
                // The cursor blinks on its own clock, as a real one does.
                opacity: { duration: 0.9, repeat: Infinity, ease: 'linear' },
              }
        }
      />

      <rect x="50" y="140" width="64" height="16" rx="8" className="fill-brand" />

      {/* 1 — the live link */}
      <path d="M134 100h58" strokeDasharray="5 6" strokeWidth="2" strokeLinecap="round" className="stroke-brand-tint" />
      {[0, 1, 2].map((index) => (
        <motion.circle
          key={index}
          cx={146}
          cy="100"
          r="3.5"
          className="fill-brand"
          animate={still ? undefined : { x: [0, TRAVEL, 0] }}
          transition={still ? undefined : loop({ delay: index * 0.18 })}
          style={still ? { transform: `translateX(${index * 16}px)` } : undefined}
        />
      ))}

      {/* staff dashboard */}
      <rect x="196" y="48" width="132" height="104" rx="14" className="fill-white stroke-brand-wash" strokeWidth="2" />
      <rect x="210" y="62" width="46" height="7" rx="3.5" className="fill-navy-900" opacity="0.75" />

      {/* 4 — radar ping on the live indicator. Tailwind's own keyframe; the
              class fixes the SVG transform origin, which defaults to 0 0. */}
      {!still && <circle cx="314" cy="65" r="4" className="svg-ping animate-ping fill-state-ok" opacity="0.6" />}
      <circle cx="314" cy="65" r="4" className="fill-state-ok" />

      <rect x="210" y="82" width="104" height="12" rx="6" className="fill-brand-wash" />
      <rect x="210" y="82" width="4" height="12" rx="2" className="fill-brand" />
      <rect x="210" y="102" width="88" height="12" rx="6" className="fill-brand-wash" />
      <rect x="210" y="122" width="96" height="12" rx="6" className="fill-brand-wash" />
    </svg>
  )
}
