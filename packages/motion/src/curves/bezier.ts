import type { EasingCurve } from '@motion-studio/tokens'

/**
 * A cubic Bézier easing evaluated the way a browser evaluates it: the curve is parametric, so the
 * progress a caller has is `x` and the value it wants is `y`, and getting from one to the other means
 * solving `X(u) = t` first.
 *
 * Newton-Raphson converges in a handful of iterations everywhere the derivative is healthy; where it
 * is not — the flat start of `expoOut`, for instance — the search falls back to bisection, which is
 * slower and always converges. Both are bounded, so this never spins.
 */
export function cubicBezier(curve: EasingCurve, t: number): number {
  const [x1, y1, x2, y2] = curve

  if (t <= 0) {
    return 0
  }

  if (t >= 1) {
    return 1
  }

  // The identity curve: `X(u) = u`, so the search would return `t` after doing arithmetic to find it.
  if (x1 === y1 && x2 === y2) {
    return t
  }

  return sample(y1, y2, solve(x1, x2, t))
}

/** `cubic-bezier(0.2, 0, 0, 1)` — the form CSS takes and the generator prints. */
export const toCssString = (curve: EasingCurve): string =>
  `cubic-bezier(${curve.map(format).join(', ')})`

/**
 * The inverse, for reading a curve back out of CSS a user wrote — the playground's editor and the
 * round-trip the generator's tests assert. Anything that is not four finite numbers is not a curve.
 */
export function fromCssString(value: string): EasingCurve | null {
  const match = /^cubic-bezier\(([^)]*)\)$/.exec(value.trim())
  const parts = match?.[1]?.split(',').map((part) => Number(part.trim()))

  if (parts === undefined || parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return null
  }

  const [x1, y1, x2, y2] = parts as [number, number, number, number]

  return [x1, y1, x2, y2]
}

/** Trailing zeros are noise in generated CSS: `0.20000000000000001` is the same curve as `0.2`. */
const format = (value: number): string => String(Number(value.toFixed(4)))

const sample = (a1: number, a2: number, u: number): number =>
  ((coefficientA(a1, a2) * u + coefficientB(a1, a2)) * u + coefficientC(a1)) * u

const coefficientA = (a1: number, a2: number): number => 1 - 3 * a2 + 3 * a1
const coefficientB = (a1: number, a2: number): number => 3 * a2 - 6 * a1
const coefficientC = (a1: number): number => 3 * a1

const slope = (a1: number, a2: number, u: number): number =>
  3 * coefficientA(a1, a2) * u * u + 2 * coefficientB(a1, a2) * u + coefficientC(a1)

const NEWTON_ITERATIONS = 8
const NEWTON_MIN_SLOPE = 0.001
const BISECTION_ITERATIONS = 24
const PRECISION = 1e-7

/** The parametric `u` at which the curve's `x` equals `t`. */
function solve(x1: number, x2: number, t: number): number {
  let guess = t

  for (let index = 0; index < NEWTON_ITERATIONS; index += 1) {
    const derivative = slope(x1, x2, guess)

    if (Math.abs(derivative) < NEWTON_MIN_SLOPE) {
      return bisect(x1, x2, t)
    }

    const error = sample(x1, x2, guess) - t

    if (Math.abs(error) < PRECISION) {
      return guess
    }

    guess -= error / derivative
  }

  return guess < 0 || guess > 1 ? bisect(x1, x2, t) : guess
}

function bisect(x1: number, x2: number, t: number): number {
  let low = 0
  let high = 1
  let guess = t

  for (let index = 0; index < BISECTION_ITERATIONS; index += 1) {
    guess = (low + high) / 2

    const error = sample(x1, x2, guess) - t

    if (Math.abs(error) < PRECISION) {
      return guess
    }

    if (error > 0) {
      high = guess
    } else {
      low = guess
    }
  }

  return guess
}
