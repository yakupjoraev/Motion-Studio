/** The four control points of a cubic Bézier, in `cubic-bezier(x1, y1, x2, y2)` order. */
export type EasingCurve = readonly [x1: number, y1: number, x2: number, y2: number]

/**
 * `DESIGN_SYSTEM.md` § Motion tokens. Kept as control points rather than CSS strings because the
 * motion engine feeds them to Motion's `ease` as an array and the generator formats the CSS form
 * from the same data.
 *
 * `spring`, `bounce`, and `anticipate` overshoot deliberately: their `y` values leave 0–1, which is
 * legal for `cubic-bezier` and is what produces the overshoot.
 *
 * `emphasized` carries the same control points as `standard` in the document. Transcribed as given;
 * whether they should differ is the document's decision, not this file's.
 */
export const EASING = {
  linear: [0, 0, 1, 1],
  standard: [0.2, 0, 0, 1],
  decelerate: [0, 0, 0.2, 1],
  accelerate: [0.4, 0, 1, 1],
  emphasized: [0.2, 0, 0, 1],
  spring: [0.34, 1.56, 0.64, 1],
  bounce: [0.68, -0.55, 0.27, 1.55],
  anticipate: [0.38, -0.4, 0.2, 1.4],
} as const satisfies Record<string, EasingCurve>

export type EasingToken = keyof typeof EASING
