'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { FrozenRouter } from './FrozenRouter'

/**
 * Crossfade between routes: the outgoing page fades to 0 while the incoming one
 * fades to 1, both at once.
 *
 * Lives here rather than in template.tsx on purpose. Next re-instantiates a
 * template on every navigation, so an AnimatePresence placed inside one is
 * itself torn down and rebuilt — there is no surviving boundary left to run an
 * exit animation. This component is rendered from the layout, which persists, so
 * AnimatePresence lives across the navigation and can hold both pages.
 *
 * `mode="popLayout"` takes the exiting page out of normal flow (Framer sets
 * position: absolute on it), so the two never stack vertically and the page
 * height is set by the incoming route alone — no scroll jump mid-fade. The
 * container is `relative` to give that absolute positioning something to anchor
 * to.
 */

const DURATION = 0.2

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Framer animates via inline styles, so the global prefers-reduced-motion
  // rule in globals.css does not reach it — it has to be honoured here.
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : DURATION, ease: 'easeInOut' }}
          className="w-full"
        >
          <FrozenRouter>{children}</FrozenRouter>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
