'use client'

import { useEffect, useRef } from 'react'

/**
 * Looping background video for the alternate hero.
 *
 * `muted` is not decoration — no browser will autoplay a video with sound, so
 * the audio track was stripped from the file as well. `playsInline` is what
 * stops iOS taking it fullscreen.
 *
 * Reduced motion is handled by pausing rather than by swapping the element:
 * the poster frame is already there underneath, so a pause shows a still image
 * with no second render path and nothing for hydration to disagree about.
 */
export function HeroVideo({ className }: { className?: string }) {
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')

    const apply = () => {
      const element = video.current
      if (!element) return
      if (query.matches) element.pause()
      // Autoplay can still be refused (low power mode, for one). The poster
      // stays up if it is, which is a fine outcome for a decorative loop.
      else void element.play().catch(() => {})
    }

    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])

  return (
    <video
      ref={video}
      className={className}
      src="/hero.mp4"
      poster="/hero-poster.jpg"
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
    />
  )
}
