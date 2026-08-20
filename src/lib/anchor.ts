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

export function anchorPopover(panel: HTMLElement, trigger: HTMLElement, minWidth = 0): void {
  const box = trigger.getBoundingClientRect()
  const below = window.innerHeight - box.bottom
  const placeAbove = below < PANEL_MAX_HEIGHT && box.top > below

  panel.dataset.placement = placeAbove ? 'above' : 'below'
  panel.style.setProperty('--lb-x', `${box.left}px`)
  panel.style.setProperty('--lb-w', `${Math.max(box.width, minWidth)}px`)
  panel.style.setProperty('--lb-y', `${box.bottom + 6}px`)
  panel.style.setProperty('--lb-b', `${window.innerHeight - box.top + 6}px`)
}
