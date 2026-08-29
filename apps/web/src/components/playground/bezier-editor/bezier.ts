import { EASINGS, type EasingName } from '@motion-studio/motion/curves'

/**
 * The curve model. X is clamped to [0, 1] and Y is not: CSS requires the control points' abscissae to
 * be in range, and a `cubic-bezier()` that breaks that rule is not "slightly wrong" — the whole
 * declaration is invalid and the transition silently falls back to `linear`. Y outside the range is
 * legal and is how overshoot is written.
 */
export interface Bezier {
  readonly x1: number
  readonly y1: number
  readonly x2: number
  readonly y2: number
}

export const DEFAULT_BEZIER: Bezier = { x1: 0.4, y1: 0, x2: 0.2, y2: 1 }

const clampX = (value: number): number => Math.min(1, Math.max(0, value))

/** Three decimals: `cubic-bezier` values are read at two, and the third keeps a drag from stepping. */
const round = (value: number): number => Math.round(value * 1000) / 1000

export const clampBezier = (curve: Bezier): Bezier => ({
  x1: round(clampX(curve.x1)),
  y1: round(curve.y1),
  x2: round(clampX(curve.x2)),
  y2: round(curve.y2),
})

const CUBIC_BEZIER = /cubic-bezier\(\s*([^)]*)\)/i

export function parseBezier(input: string): Bezier | undefined {
  const body = CUBIC_BEZIER.exec(input)?.[1]

  if (body === undefined) {
    return undefined
  }

  const numbers = body.split(',').map((part) => Number(part.trim()))

  const [x1, y1, x2, y2] = numbers

  if (
    numbers.length !== 4 ||
    x1 === undefined ||
    y1 === undefined ||
    x2 === undefined ||
    y2 === undefined ||
    numbers.some((one) => !Number.isFinite(one))
  ) {
    return undefined
  }

  return clampBezier({ x1, y1, x2, y2 })
}

export const toCssString = (curve: Bezier): string =>
  `cubic-bezier(${curve.x1}, ${curve.y1}, ${curve.x2}, ${curve.y2})`

/** The curve back into the value it came from, so the duration and the property survive the edit. */
export function replaceBezier(input: string, curve: Bezier): string {
  return CUBIC_BEZIER.test(input)
    ? input.replace(CUBIC_BEZIER, toCssString(curve))
    : `${input.trimEnd()} ${toCssString(curve)}`.trim()
}

export interface NamedCurve {
  readonly name: string
  readonly curve: Bezier
}

const named = (name: EasingName): NamedCurve => {
  const [x1, y1, x2, y2] = EASINGS[name]

  return { name, curve: { x1, y1, x2, y2 } }
}

/** ANIMATION_SYSTEM.md's twelve, offered as starting points beside "custom". */
export const NAMED_CURVES: readonly NamedCurve[] = (
  Object.keys(EASINGS) as readonly EasingName[]
).map(named)

const same = (a: Bezier, b: Bezier): boolean =>
  a.x1 === b.x1 && a.y1 === b.y1 && a.x2 === b.x2 && a.y2 === b.y2

export const curveName = (curve: Bezier): string =>
  NAMED_CURVES.find((entry) => same(entry.curve, curve))?.name ?? 'custom'

/** The SVG path for a unit square drawn top-left origin, which is where the editor's grid starts. */
export function bezierPath(curve: Bezier, size: number): string {
  const x = (value: number): number => value * size
  const y = (value: number): number => size - value * size

  return `M 0 ${size} C ${x(curve.x1)} ${y(curve.y1)}, ${x(curve.x2)} ${y(curve.y2)}, ${size} 0`
}

export const bezierLabel = (curve: Bezier): string =>
  `${curve.x1}, ${curve.y1}, ${curve.x2}, ${curve.y2}`
