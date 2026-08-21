/**
 * Which section the reader is looking at, given how much of each one is on
 * screen.
 *
 * Pulled out of the component because it is the only part with a decision in
 * it, and because IntersectionObserver cannot be exercised without a browser
 * running frames — the observer is plumbing, this is the behaviour.
 */
export function pickActiveSection<T extends string>(
  /** Sections in document order. Order decides ties. */
  order: readonly T[],
  /** Visible fraction per section, 0 to 1. Missing counts as 0. */
  ratios: ReadonlyMap<string, number>,
  /** Held when nothing is on screen, so the panel never blanks. */
  current: T,
): T {
  let best = current
  let bestRatio = 0

  for (const id of order) {
    const ratio = ratios.get(id) ?? 0
    // Strictly greater, so a tie keeps the earlier section: on the boundary
    // between two, the picture settles rather than flickering between them.
    if (ratio > bestRatio) {
      bestRatio = ratio
      best = id
    }
  }

  return best
}
