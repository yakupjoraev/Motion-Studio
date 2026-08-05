export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

/**
 * The inverse of `lerp`: where `value` sits between `from` and `to`, as 0–1. Not clamped, so a value
 * outside the range returns a `t` outside 0–1 — the inspector uses that to detect an out-of-range
 * scrub before clamping it.
 *
 * A zero-length range returns 0 rather than dividing by it. The alternatives are `NaN` and
 * `Infinity`, and both reach a CSS custom property intact, where they silently drop the declaration
 * instead of failing.
 */
export function inverseLerp(from: number, to: number, value: number): number {
  if (from === to) {
    return 0
  }

  return (value - from) / (to - from)
}

/** Rounds half away from zero, so `round(-0.5)` is `-1` rather than `Math.round`'s `-0`. */
export function round(value: number, precision = 0): number {
  const factor = 10 ** precision
  const scaled = value * factor

  return (scaled < 0 ? -Math.round(-scaled) : Math.round(scaled)) / factor
}

/** Nearest multiple of `step`. A step of 0 leaves the value alone: every number is a multiple of 0. */
export function snapTo(value: number, step: number): number {
  if (step === 0) {
    return value
  }

  return Math.round(value / step) * step
}

/**
 * Float comparison with an absolute tolerance. `1e-6` is below the precision of anything this
 * codebase compares — CSS pixel values, OKLCH channels in 0–1, and easing control points — and above
 * the accumulated error of the coordinate round-trips in `CANVAS.md` § Coordinate spaces.
 */
export function approxEqual(a: number, b: number, epsilon = 1e-6): boolean {
  return Math.abs(a - b) <= epsilon
}
