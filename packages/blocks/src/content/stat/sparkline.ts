/**
 * The sparkline, as a pure function. No chart library — PERFORMANCE.md's cheapest possible answer is
 * a `<path>` string, and a library that draws one line would be the largest dependency in the package.
 *
 * The viewBox is fixed and the path is normalised into it, so the SVG scales with its container and
 * the numbers never reach the DOM as a size. Two decisions worth naming:
 *
 *   - a flat series has no range to normalise against, so it is drawn on the centre line rather than
 *     divided by zero;
 *   - coordinates are rounded to two decimals. An unrounded path is 4× longer, differs between
 *     machines in its last digit, and would make the thumbnail generator's byte-for-byte comparison
 *     fail for a reason that has nothing to do with the picture.
 */
export const SPARKLINE_VIEWBOX = { width: 100, height: 32 } as const

const round = (value: number): number => Math.round(value * 100) / 100

export interface SparklineGeometry {
  /** The line itself. Empty when there is nothing to draw. */
  readonly line: string
  /** The same line closed along the baseline, for the area fill under it. */
  readonly area: string
}

export function sparklinePath(values: readonly number[]): SparklineGeometry {
  const finite = values.filter((value) => Number.isFinite(value))

  if (finite.length < 2) {
    return { line: '', area: '' }
  }

  const { width, height } = SPARKLINE_VIEWBOX
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  const range = max - min
  const step = width / (finite.length - 1)

  const points = finite.map((value, index) => {
    const x = round(index * step)
    // A flat series sits on the centre line; anything else spans the full height, top-down in SVG.
    const y = round(range === 0 ? height / 2 : height - ((value - min) / range) * height)

    return `${x} ${y}`
  })

  const line = `M${points.join(' L')}`

  return {
    line,
    area: `${line} L${round(width)} ${height} L0 ${height} Z`,
  }
}
