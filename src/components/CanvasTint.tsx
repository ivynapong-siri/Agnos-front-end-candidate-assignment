'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Paints the strip that `scrollbar-gutter: stable` reserves.
 *
 * That reservation keeps the header from jumping 7px between a page that
 * scrolls and one that does not, which is worth having. The cost is 15px down
 * the right that nothing inside <body> can reach: `inset-0` stops at the
 * reservation, and so does 100vw, because the gutter shrinks the block the vw
 * unit is measured against. The only thing that paints there is the canvas,
 * which takes its background from <html>.
 *
 * Only the landing page needs it. Everywhere else the ground is body's paper
 * right up to the edge, so the gutter already matches; the landing page runs
 * artwork to the edge instead, and the gutter beside it read as a stripe.
 *
 * One component in the layout reading the route, rather than one per page
 * cleaning up after itself: the page transition keeps the outgoing tree mounted
 * until its exit animation finishes, so a cleanup on unmount fires late — and
 * never at all if that animation is interrupted.
 */

/** Sampled off the source down the column where the frame ends, where it holds
 *  between 232 and 247 per channel. Body's paper, #FCFAFA, is lighter and
 *  warmer, which is what made the strip visible. */
const LANDING_TINT = '#EBEEF4'

export function CanvasTint() {
  const pathname = usePathname()
  // `/th` and `/en` are the landing pages; anything deeper is a normal page.
  const onLanding = pathname.split('/').filter(Boolean).length <= 1

  useEffect(() => {
    const root = document.documentElement
    if (onLanding) root.style.backgroundColor = LANDING_TINT
    else root.style.removeProperty('background-color')
  }, [onLanding])

  return null
}
