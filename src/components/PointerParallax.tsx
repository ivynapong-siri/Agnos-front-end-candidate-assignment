'use client'

import { useEffect } from 'react'

/**
 * Publishes the pointer's offset from the centre of the viewport as two CSS
 * variables on <html>, for the hero artwork to drift against.
 *
 * A variable rather than a ref into the artwork, because the effect is one
 * listener feeding whatever wants to read it, and the alternative is turning a
 * server component into a client one just to hold a style object.
 *
 * Nothing is published until the pointer moves, so the fallbacks in `.hero-art`
 * hold and the artwork sits still — which is also exactly what happens on a
 * touch screen, where this returns before attaching anything.
 */
export function PointerParallax({ intensity = 0.08 }: { intensity?: number }) {
  useEffect(() => {
    // A finger has no hover position to track, and a pointer that can only
    // report taps would make the artwork jump rather than drift.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const root = document.documentElement
    const shift = intensity * 100

    const onMove = (event: PointerEvent) => {
      // Away from the pointer, not towards it: the artwork sits behind the
      // text, and depth reads as the background lagging the foreground.
      const x = (0.5 - event.clientX / window.innerWidth) * 2 * shift
      const y = (0.5 - event.clientY / window.innerHeight) * 2 * shift
      root.style.setProperty('--parallax-x', `${x.toFixed(1)}px`)
      root.style.setProperty('--parallax-y', `${y.toFixed(1)}px`)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      root.style.removeProperty('--parallax-x')
      root.style.removeProperty('--parallax-y')
    }
  }, [intensity])

  return null
}
