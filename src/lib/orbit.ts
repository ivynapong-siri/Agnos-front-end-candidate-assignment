/**
 * Geometry for the staff board's waiting animation: three dots that orbit a
 * shared centre, gather into one point, scatter back out, and carry on.
 *
 * Kept out of the component so the phase maths is testable — "all three dots
 * coincide at the midpoint" is the whole merge phase expressed as one assertion.
 */

export const CYCLE_SECONDS = 4
/** Keyframes per loop. Twenty-four is smooth at this size and stays readable. */
export const STEPS = 24
export const CENTRE = { x: 100, y: 70 }
export const ORBIT = 26
export const DOT_COUNT = 3
/** Offset between dots so they gather in sequence rather than all at once. */
export const STAGGER_SECONDS = 0.12

/** Eases the gather and scatter so neither starts or stops abruptly. */
const smooth = (p: number) => p * p * (3 - 2 * p)

/**
 * How far out a dot sits, as a fraction of the orbit radius, across one loop:
 *
 *   0.00 – 0.35   orbit at full radius
 *   0.35 – 0.50   gather to the centre
 *   0.50 – 0.68   scatter back out
 *   0.68 – 1.00   orbit again
 */
export function radiusAt(t: number): number {
  if (t < 0.35) return 1
  if (t < 0.5) return 1 - smooth((t - 0.35) / 0.15)
  if (t < 0.68) return smooth((t - 0.5) / 0.18)
  return 1
}

export type OrbitFrames = { cx: number[]; cy: number[]; times: number[] }

/**
 * Position keyframes for one dot. The rotation runs through the whole loop, so
 * the gather happens while orbiting and the dots spiral in rather than freezing.
 *
 * First and last frame are the same point, which makes the loop seamless — and
 * is what lets each dot carry a permanent time offset without a visible jump.
 */
export function orbitFrames(index: number): OrbitFrames {
  const base = (index * 2 * Math.PI) / DOT_COUNT
  const cx: number[] = []
  const cy: number[] = []
  const times: number[] = []

  for (let step = 0; step <= STEPS; step++) {
    const t = step / STEPS
    const angle = base + t * 2 * Math.PI
    const radius = ORBIT * radiusAt(t)
    cx.push(Number((CENTRE.x + radius * Math.cos(angle)).toFixed(2)))
    cy.push(Number((CENTRE.y + radius * Math.sin(angle)).toFixed(2)))
    times.push(t)
  }

  return { cx, cy, times }
}

/** Where a dot sits with motion reduced: evenly spaced on the orbit. */
export function restingPosition(index: number): { cx: number; cy: number } {
  const angle = (index * 2 * Math.PI) / DOT_COUNT
  return {
    cx: Number((CENTRE.x + ORBIT * Math.cos(angle)).toFixed(2)),
    cy: Number((CENTRE.y + ORBIT * Math.sin(angle)).toFixed(2)),
  }
}
