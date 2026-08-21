/**
 * How far a button leans towards the pointer.
 *
 * Separated from the component because the spring that carries the button there
 * needs a browser running frames, while the decision — how far, in which
 * direction, and whether at all — does not.
 */

/** How far outside the button the pull begins. */
export const CATCH_PADDING = 28
/** Furthest the button will travel from where it belongs. */
export const MAX_PULL = 18
/** Share of the distance to the pointer, before clamping. */
export const PULL = 0.32

export type Box = { left: number; top: number; right: number; bottom: number }

const clamp = (value: number) => Math.max(-MAX_PULL, Math.min(MAX_PULL, value))

export function magneticPull(
  pointerX: number,
  pointerY: number,
  box: Box,
): { x: number; y: number } {
  // A zero-width box is an element hidden at this breakpoint. Reaching for the
  // centre of nothing would park the button at the top-left of the viewport.
  if (box.right <= box.left || box.bottom <= box.top) return { x: 0, y: 0 }

  const near =
    pointerX >= box.left - CATCH_PADDING &&
    pointerX <= box.right + CATCH_PADDING &&
    pointerY >= box.top - CATCH_PADDING &&
    pointerY <= box.bottom + CATCH_PADDING

  if (!near) return { x: 0, y: 0 }

  return {
    x: clamp((pointerX - (box.left + box.right) / 2) * PULL),
    y: clamp((pointerY - (box.top + box.bottom) / 2) * PULL),
  }
}
