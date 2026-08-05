/**
 * `DESIGN_SYSTEM.md` § Motion tokens. Milliseconds, not strings, because `theme.motionScale`
 * (0 / 0.5 / 1 / 1.5) multiplies every one of them and the generator formats the product.
 *
 * A scale of 0 is the reduced-motion equivalent, which is what makes reduced motion and the scale
 * one code path rather than a branch at every call site.
 */
export const DURATION = {
  instant: 0,
  fast: 120,
  quick: 180,
  base: 240,
  slow: 360,
  slower: 520,
  slowest: 800,
} as const

export type DurationToken = keyof typeof DURATION
