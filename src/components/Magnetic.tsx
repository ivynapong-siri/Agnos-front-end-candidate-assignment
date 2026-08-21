'use client'

import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { magneticPull } from '@/lib/magnetic'

/**
 * Leans a button towards the pointer as it approaches, and lets it fall back
 * when the pointer leaves.
 *
 * The pull is applied to this wrapper rather than to the button, because one of
 * the three buttons that uses it is `position: fixed` — and a transformed
 * ancestor becomes the containing block for fixed descendants, which would drop
 * the floating button out of its corner. So the wrapper carries the positioning
 * *and* the transform, and the button inside stays static.
 *
 * The listener is on the window, not on the element: the effect is supposed to
 * catch the pointer slightly before it arrives, and an element can only report
 * a pointer already on top of it.
 */

export function Magnetic({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const host = useRef<HTMLSpanElement>(null)
  const reduceMotion = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  // A spring rather than a transition, so it trails the pointer slightly on the
  // way in and settles on the way out instead of snapping to either.
  const spring = { stiffness: 220, damping: 20, mass: 0.5 }
  const springX = useSpring(x, spring)
  const springY = useSpring(y, spring)

  useEffect(() => {
    // A finger has no approach to track, and a pointer that only reports taps
    // would jump the button out from under the tap that is landing on it.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (reduceMotion) return

    const onMove = (event: PointerEvent) => {
      const element = host.current
      if (!element) return
      const pull = magneticPull(event.clientX, event.clientY, element.getBoundingClientRect())
      x.set(pull.x)
      y.set(pull.y)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    // Leaving the window entirely fires no further move events, so the button
    // would otherwise stay leaning at whatever the last reading was.
    const release = () => {
      x.set(0)
      y.set(0)
    }
    window.addEventListener('pointerleave', release)
    window.addEventListener('blur', release)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', release)
      window.removeEventListener('blur', release)
      release()
    }
  }, [reduceMotion, x, y])

  return (
    <motion.span ref={host} style={{ x: springX, y: springY }} className={className}>
      {children}
    </motion.span>
  )
}
