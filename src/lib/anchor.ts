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
 * side by side. Matching the trigger there truncated every label to nothing and
 * left the rows overflowing sideways.
 *
 * 288 rather than a rounder number: the longest label in the list is the Thai
 * for the United Arab Emirates, and measured at 240 it still needed 42px more.
 */
export const PANEL_MIN_WIDTH = 288

/** Breathing room kept between the panel and the viewport edge. */
const GUTTER = 8

/**
 * Widening the panel past its trigger means it can now run off the right edge,
 * which matching the trigger's width could never do. Pure, so the clamp is
 * testable without a DOM.
 */
export function clampLeft(left: number, width: number, viewportWidth: number): number {
  return Math.max(GUTTER, Math.min(left, viewportWidth - width - GUTTER))
}

export function anchorPopover(panel: HTMLElement, trigger: HTMLElement, minWidth = 0): void {
  const box = trigger.getBoundingClientRect()
  const below = window.innerHeight - box.bottom
  const placeAbove = below < PANEL_MAX_HEIGHT && box.top > below
  const width = Math.min(
    Math.max(box.width, minWidth, PANEL_MIN_WIDTH),
    window.innerWidth - GUTTER * 2,
  )

  panel.dataset.placement = placeAbove ? 'above' : 'below'
  panel.style.setProperty('--lb-x', `${clampLeft(box.left, width, window.innerWidth)}px`)
  panel.style.setProperty('--lb-w', `${width}px`)
  panel.style.setProperty('--lb-y', `${box.bottom + 6}px`)
  panel.style.setProperty('--lb-b', `${window.innerHeight - box.top + 6}px`)
}

/** Below this width the panel is a viewport-fixed bottom sheet and needs no
 *  anchoring, so scroll tracking is pointless — and would be actively wrong,
 *  since it would close the sheet when the page behind it moved. */
const ANCHORED_FROM = 640

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
  if (window.innerWidth < ANCHORED_FROM) return () => {}

  const reposition = () => {
    const box = trigger.getBoundingClientRect()
    if (isOutOfView(box.top, box.bottom, window.innerHeight)) {
      panel.hidePopover()
      return
    }
    anchorPopover(panel, trigger, minWidth)
  }

  window.addEventListener('scroll', reposition, { capture: true, passive: true })
  window.addEventListener('resize', reposition)

  return () => {
    window.removeEventListener('scroll', reposition, { capture: true })
    window.removeEventListener('resize', reposition)
  }
}
