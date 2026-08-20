'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  CENTRE,
  CYCLE_SECONDS,
  ORBIT,
  STAGGER_SECONDS,
  orbitFrames,
  restingPosition,
} from '@/lib/orbit'

/** One class per dot, so the three stay tellable apart while they orbit. */
const DOT_FILLS = ['fill-brand', 'fill-brand-tint', 'fill-navy-900']
const DOT_RADIUS = 9

/**
 * The staff board's empty state: three dots waiting for a patient to appear.
 *
 * One loop, four phases:
 *   1. orbit a shared centre
 *   2. gather into a single point
 *   3. scatter back out
 *   4. carry on orbiting, which is phase 1 again
 *
 * The rotation never stops — the gather happens *while* orbiting, so the dots
 * spiral in and back out rather than freezing to do it. Each dot is offset in
 * time as well as angle, so they arrive in sequence instead of snapping
 * together as one.
 *
 * Positions are keyframed as cx/cy rather than rotating a group: an SVG group
 * rotates about the viewBox origin unless transform-box and transform-origin are
 * both set, and animating the coordinates directly avoids that trap while making
 * each phase's shape explicit.
 */

export function ArtWaiting({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <svg viewBox="0 0 200 140" fill="none" className={className} aria-hidden="true">
      <circle cx={CENTRE.x} cy={CENTRE.y} r="52" className="fill-brand-wash" opacity="0.7" />
      {/* The path the dots travel, so the orbit reads even at a glance. */}
      <circle
        cx={CENTRE.x}
        cy={CENTRE.y}
        r={ORBIT}
        strokeDasharray="3 7"
        strokeWidth="1.5"
        className="stroke-brand-tint"
        opacity="0.5"
      />

      {DOT_FILLS.map((fill, index) => {
        const resting = restingPosition(index)
        if (reduceMotion) {
          return <circle key={index} cx={resting.cx} cy={resting.cy} r={DOT_RADIUS} className={fill} />
        }

        const frames = orbitFrames(index)
        return (
          <motion.circle
            key={index}
            r={DOT_RADIUS}
            className={fill}
            initial={{ cx: frames.cx[0], cy: frames.cy[0] }}
            animate={{ cx: frames.cx, cy: frames.cy }}
            transition={{
              duration: CYCLE_SECONDS,
              times: frames.times,
              repeat: Infinity,
              ease: 'linear',
              // Staggered so they gather in sequence rather than all at once.
              delay: index * STAGGER_SECONDS,
            }}
          />
        )
      })}
    </svg>
  )
}
