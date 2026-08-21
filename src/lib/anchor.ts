/**
 * Places a popover next to the element that opened it.
 *
 * A popover renders in the top layer and is positioned against the viewport,
 * not its DOM parent, so anchoring has to be done by hand. Below `sm` the CSS
 * ignores all of these variables and renders a bottom sheet instead, so this
 * only matters on larger screens.
 *
 * Flipping above the trigger sets `bottom` rather than `top`, which means the
 * panel's height never has to be measured before it is shown.
 */

/** Keep in step with max-height on .listbox-panel in globals.css. */
export const PANEL_MAX_HEIGHT = 288

/**
 * Floor for the panel width. A trigger is free to be narrow — the phone country
 * code is 7.5rem — but its menu still has to fit a country name and a dial code
 * side by side.
 */
export const PANEL_MIN_WIDTH = 288

/** Breathing room kept between the panel and the edge of the screen. */
const GUTTER = 8
/** Distance between the panel and the control it belongs to. */
const GAP = 6

/**
 * Widening the panel past its trigger means it can now run off the right edge,
 * which matching the trigger's width could never do. Pure, so the clamp is
 * testable without a DOM.
 */
export function clampLeft(left: number, width: number, viewportWidth: number): number {
  return Math.max(GUTTER, Math.min(left, viewportWidth - width - GUTTER))
}

/** Where the panel's top edge goes, given where the trigger is and how tall the
 *  panel turned out to be. Below the trigger when it fits, above it when it does
 *  not, and never past either edge of the screen. Pure — this is the arithmetic
 *  that was getting the answer wrong, so it is the part worth testing. */
export function panelTop(
  triggerTop: number,
  triggerBottom: number,
  panelHeight: number,
  viewportHeight: number,
): number {
  const below = triggerBottom + GAP
  const fitsBelow = below + panelHeight <= viewportHeight - GUTTER
  const wanted = fitsBelow ? below : triggerTop - GAP - panelHeight
  const lowest = Math.max(GUTTER, viewportHeight - GUTTER - panelHeight)
  return Math.min(Math.max(GUTTER, wanted), lowest)
}

/**
 * Places a popover against the control that opened it.
 *
 * Everything here is measured with getBoundingClientRect and
 * documentElement.clientWidth/Height, which are the same coordinate space
 * `position: fixed` resolves against. Nothing asks where the bottom of the
 * screen is.
 *
 * It used to. Below 640px the panel was a sheet pinned to the bottom of the
 * viewport, and on a phone that is not where it looks: `bottom: 0` means the
 * bottom of the *layout* viewport, measured with the address bar hidden. In
 * LINE's in-app browser it opened almost entirely below the fold — the chevron
 * flipped to say "open" and a sliver of the panel showed at the very edge.
 * visualViewport was supposed to correct for that, and an in-app WebView does
 * not report it reliably enough to build on.
 *
 * Call this *after* showPopover(): the panel has to be laid out before its
 * height can be read, and the height decides whether it goes below the trigger
 * or above it. Both happen synchronously, so the browser paints once.
 */
export function anchorPopover(panel: HTMLElement, trigger: HTMLElement, minWidth = 0): void {
  const viewportWidth = document.documentElement.clientWidth
  const viewportHeight = document.documentElement.clientHeight
  const box = trigger.getBoundingClientRect()

  const width = Math.min(
    Math.max(box.width, minWidth, PANEL_MIN_WIDTH),
    viewportWidth - GUTTER * 2,
  )
  // Width first: it decides how the options wrap, and therefore the height.
  panel.style.setProperty('--lb-w', `${width}px`)

  const height = panel.getBoundingClientRect().height
  panel.style.setProperty('--lb-x', `${clampLeft(box.left, width, viewportWidth)}px`)
  panel.style.setProperty('--lb-y', `${panelTop(box.top, box.bottom, height, viewportHeight)}px`)
}

/**
 * A trigger scrolled out of sight leaves the panel floating beside nothing,
 * which reads worse than a closed panel. Pure, so the boundary cases are
 * testable without a DOM.
 */
export function isOutOfView(top: number, bottom: number, viewportHeight: number): boolean {
  return bottom <= 0 || top >= viewportHeight
}

/**
 * Keeps an open panel pinned to its trigger while the page scrolls or resizes.
 *
 * Positioning once on open is not enough: the panel is `position: fixed` in the
 * top layer, so it stays where it was put while the trigger scrolls away from
 * underneath it.
 *
 * Capture-phase scroll, because the page is not the only thing that can scroll —
 * an ancestor with its own overflow moves the trigger too and those events do
 * not bubble.
 *
 * Repositioning is synchronous, not rAF-throttled: browsers already coalesce
 * scroll events to about one per frame, so a throttle would only add a
 * dependency on requestAnimationFrame for no gain.
 *
 * ponytail: CSS anchor positioning (anchor-name / position-anchor) replaces this
 * whole function with two declarations, once Firefox ships it.
 *
 * Returns the teardown.
 */
export function keepAnchored(panel: HTMLElement, trigger: HTMLElement, minWidth = 0): () => void {
  const reposition = () => {
    const box = trigger.getBoundingClientRect()
    if (isOutOfView(box.top, box.bottom, document.documentElement.clientHeight)) {
      panel.hidePopover()
      return
    }
    anchorPopover(panel, trigger, minWidth)
  }

  // Capture-phase scroll, because the page is not the only thing that can
  // scroll — an ancestor with its own overflow moves the trigger too, and those
  // events do not bubble.
  window.addEventListener('scroll', reposition, { capture: true, passive: true })
  window.addEventListener('resize', reposition)
  // An on-screen keyboard resizes the visual viewport without resizing the
  // window, and it can cover the panel completely.
  window.visualViewport?.addEventListener('resize', reposition)
  window.visualViewport?.addEventListener('scroll', reposition)

  return () => {
    window.removeEventListener('scroll', reposition, { capture: true })
    window.removeEventListener('resize', reposition)
    window.visualViewport?.removeEventListener('resize', reposition)
    window.visualViewport?.removeEventListener('scroll', reposition)
  }
}
