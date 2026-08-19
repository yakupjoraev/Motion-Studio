/**
 * The chart, as pure functions. **No chart library**: everything below is sixty lines, and 34 kB of
 * dependency for a decorative landing-page chart is not a trade PERFORMANCE.md would accept.
 *
 * The viewBox is fixed and the values are normalised into it, so the SVG scales with its container and no
 * number ever reaches the DOM as a size. Coordinates are rounded to two decimals for the reason
 * `content/stat`'s sparkline gives: an unrounded path differs between machines in its last digit, which would
 * make the thumbnail generator's byte-for-byte comparison fail for a reason that has nothing to do with the
 * picture.
 */
export const CHART_VIEWBOX = { width: 240, height: 96 } as const

const round = (value: number): number => Math.round(value * 100) / 100

const finiteOf = (values: readonly number[]): number[] => values.filter(Number.isFinite)

export interface ChartPoint {
  readonly x: number
  readonly y: number
}

/**
 * Where the line's vertices sit.
 *
 * A line is normalised between the series' own **minimum and maximum**, because a line chart reads a trend and
 * a trend among values from 980 to 1020 is invisible against a zero baseline. A flat series has no range to
 * normalise against, so it is drawn on the centre line rather than divided by zero.
 */
export function chartPoints(values: readonly number[]): readonly ChartPoint[] {
  const finite = finiteOf(values)

  if (finite.length < 2) {
    return []
  }

  const { width, height } = CHART_VIEWBOX
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  const range = max - min
  const step = width / (finite.length - 1)

  return finite.map((value, index) => ({
    x: round(index * step),
    y: round(range === 0 ? height / 2 : height - ((value - min) / range) * height),
  }))
}

export const linePath = (points: readonly ChartPoint[]): string =>
  points.length === 0 ? '' : `M${points.map((point) => `${point.x} ${point.y}`).join(' L')}`

/** The same line closed along the baseline, which is the only difference between a line and an area. */
export const areaPath = (points: readonly ChartPoint[]): string => {
  const line = linePath(points)

  if (line === '') {
    return ''
  }

  const { width, height } = CHART_VIEWBOX

  return `${line} L${width} ${height} L0 ${height} Z`
}

/**
 * The vertices, as zero-length segments.
 *
 * A `<circle>` cannot be used here: `preserveAspectRatio="none"` stretches the viewBox, and a stretched circle is
 * an ellipse. A zero-length subpath drawn with `stroke-linecap: round` and `vectorEffect="non-scaling-stroke"` is
 * a round dot in *device* space, so it stays round at every container aspect — which is the whole reason the
 * markers are a path rather than six elements.
 */
export const dotsPath = (points: readonly ChartPoint[]): string =>
  points.map((point) => `M${point.x} ${point.y}L${point.x} ${point.y}`).join('')

export interface ChartBar {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** The gap between bars, as a share of the slot each bar gets. */
const BAR_GAP = 0.3

/**
 * The bars.
 *
 * Measured from **zero**, not from the series' minimum, and that is not a preference: a bar's length is read
 * as its magnitude, so a baseline anywhere else overstates every difference in the set. The line above is
 * normalised differently for exactly the opposite reason.
 *
 * A negative value draws nothing rather than a bar below the axis — this block has no axis to be below.
 */
export function chartBars(values: readonly number[]): readonly ChartBar[] {
  const finite = finiteOf(values)

  if (finite.length === 0) {
    return []
  }

  const { width, height } = CHART_VIEWBOX
  const max = Math.max(...finite, 0)
  const slot = width / finite.length
  const barWidth = round(slot * (1 - BAR_GAP))

  return finite.map((value, index) => {
    const drawn = max === 0 ? 0 : round((Math.max(0, value) / max) * height)

    return {
      x: round(index * slot + (slot - barWidth) / 2),
      y: round(height - drawn),
      width: barWidth,
      height: drawn,
    }
  })
}

/**
 * The sentence a screen reader gets instead of the picture, when the author has not written one.
 *
 * It says the direction as well as the ends, because "from 12 to 84" leaves a reader to do the comparison the
 * chart exists to make for them.
 */
export function chartSummary(label: string, values: readonly number[]): string {
  const finite = finiteOf(values)
  const first = finite[0]
  const last = finite[finite.length - 1]

  if (first === undefined || last === undefined) {
    return `${label}, no data`
  }

  if (finite.length === 1 || first === last) {
    return `${label}, flat at ${first} across ${finite.length} points`
  }

  const direction = last > first ? 'rising' : 'falling'

  return `${label} ${direction} from ${first} to ${last} across ${finite.length} points`
}
