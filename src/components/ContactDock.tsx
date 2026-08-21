'use client'

import { usePathname } from 'next/navigation'
import { Magnetic } from './Magnetic'

/**
 * Where the help button sits, which turns out to depend on the page.
 *
 * Floating everywhere, it stole taps: the button is 144x48 pinned to the
 * bottom-right, and the patient form runs the full width of the shell, so
 * whichever field sat in that band lost its right-hand side to it. Hit-testing
 * the middle of a field handed the button back instead — worst on the dropdowns,
 * where a swallowed tap does nothing at all to show for it.
 *
 * In the flow everywhere, it broke the landing page: that hero is min-h-svh, so
 * a button after it adds a band below the fold and turns a page designed to fit
 * one screen into one that scrolls.
 *
 * So it depends on what is underneath. Only the patient form has small controls
 * reaching the right edge; everywhere else the targets are whole cards and a
 * covered corner costs nothing. The form waits for 1600, where the shell's
 * 1280 cap and the button's 168px inset finally clear each other with 36px to
 * spare. Everything else floats from lg as it always did.
 *
 * The positioning lives here rather than on the button because Magnetic applies
 * a transform, and a transformed ancestor becomes the containing block for a
 * fixed descendant — on the button it would drop the trigger out of its corner.
 */
export function ContactDock({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const overTheForm = pathname.includes('/patient')

  const float = overTheForm
    ? 'min-[1600px]:fixed min-[1600px]:bottom-6 min-[1600px]:right-6 min-[1600px]:mx-0 min-[1600px]:mb-0'
    : 'lg:fixed lg:bottom-6 lg:right-6 lg:mx-0 lg:mb-0'

  return (
    <Magnetic className={`enter enter-support z-30 mx-auto mb-10 flex w-fit ${float}`}>
      {children}
    </Magnetic>
  )
}
