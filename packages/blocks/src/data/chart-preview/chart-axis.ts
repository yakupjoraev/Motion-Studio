import type { ChartKind } from './chart-preview.schema'

/**
 * Three gridlines: the top of the range, its middle, and its bottom. Three rather than five because the block is a
 * preview at `h-20` to `h-48`, and five lines inside 80 px is a hatch pattern rather than a scale.
 */
export const AXIS_TICKS = 3

/**
 * The values the gridlines are labelled with, top to bottom.
 *
 * The bottom of the scale is **not** always the series' minimum, and that is the same split `chartBars` and
 * `chartPoints` already make for the marks: bars are measured from zero, so their axis has to start at zero or the
 * labels would describe a drawing that is not there. A line normalises to its own range, so its axis does too.
 */
export function axisTicks(kind: ChartKind, values: readonly number[]): readonly number[] {
  const finite = values.filter(Number.isFinite)

  if (finite.length === 0) {
    return []
  }

  const top = Math.max(...finite, kind === 'bar' ? 0 : -Number.MAX_VALUE)
  const bottom = kind === 'bar' ? Math.min(0, ...finite) : Math.min(...finite)

  if (top === bottom) {
    return [top]
  }

  return [top, (top + bottom) / 2, bottom]
}

/**
 * A tick as text. One decimal at most, and no trailing zero: an axis reading `46.0` beside a series of integers is
 * a number the reader has to parse twice.
 */
export function formatTick(value: number): string {
  if (!Number.isFinite(value)) {
    return ''
  }

  if (Number.isInteger(value)) {
    return String(value)
  }

  return String(Math.round(value * 10) / 10)
}
