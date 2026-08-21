'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { SectionId } from '@/lib/fields'
import { pickActiveSection } from '@/lib/scrollspy'

/**
 * The picture beside the form, pinned to the viewport, changing to match
 * whichever section the patient is filling in.
 *
 * It replaces three photographs stacked down the page. Three competed with each
 * other and with the questions — the eye landed on the pictures before the
 * fields, on a page whose whole job is the fields. One picture that answers the
 * question "where am I" carries the same warmth and asks for none of the
 * attention.
 *
 * Every frame is mounted at once and crossfaded by opacity, rather than
 * swapping a single `src`. Swapping the source would show a blank box for the
 * length of the network request the first time each image is reached, which is
 * exactly the abruptness the fade is there to avoid.
 */

const FRAMES: { id: SectionId; src: string; alt: string }[] = [
  { id: 'personal', src: '/section-personal.jpg', alt: 'Clean hospital lobby' },
  { id: 'contact', src: '/section-contact.jpg', alt: "Doctor's hands writing on a clipboard" },
  { id: 'background', src: '/section-background.jpg', alt: 'Senior doctor consulting' },
]

const ORDER = FRAMES.map((frame) => frame.id)

export function SectionMedia() {
  const [active, setActive] = useState<SectionId>('personal')

  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('[data-intake-section]')]
    if (sections.length === 0) return

    // How much of each section is on screen, kept between callbacks because a
    // callback only carries the entries that *changed*.
    const ratio = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.intakeSection
          if (id) ratio.set(id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }

        setActive((current) => pickActiveSection(ORDER, ratio, current))
      },
      {
        // A list, not the single 0.5 the design asked for: a section taller
        // than the viewport can never be half visible, so a lone 0.5 would
        // leave the panel stuck on whichever section last qualified. Taking
        // the most-visible section instead behaves the same when a section
        // does fit, and keeps working when one does not.
        threshold: [0, 0.15, 0.3, 0.5, 0.75, 1],
      },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    // Below lg the form is the whole page: a sticky picture there would eat the
    // screen a patient is trying to type into.
    <aside
      aria-hidden="true"
      /*
        24px below the header, not 24px below the top of the viewport: the
        header is fixed, so a smaller offset would slide the panel under it.
        top-26 and duration-600 are not on Tailwind's scale — they would have
        compiled to nothing at all — so both are written as explicit values.
      */
      className="sticky hidden self-start overflow-hidden rounded-2xl lg:top-[6.5rem] lg:block lg:h-[calc(100svh-8rem)]"
    >
      {FRAMES.map((frame) => (
        <Image
          key={frame.id}
          src={frame.src}
          alt={frame.alt}
          fill
          sizes="(min-width: 1024px) 40vw, 0px"
          className={`select-none object-cover transition-[opacity,transform] duration-[600ms] ease-in-out ${
            active === frame.id ? 'scale-100 opacity-100 delay-150' : 'scale-105 opacity-0'
          }`}
        />
      ))}
    </aside>
  )
}
