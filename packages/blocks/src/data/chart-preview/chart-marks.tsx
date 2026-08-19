import { areaPath, chartBars, chartPoints, dotsPath, linePath } from './chart-geometry'
import type { ChartKind } from './chart-preview.schema'
import { CHART_AREA_OPACITY } from './chart-preview.styles'

export interface ChartMarksProps {
  readonly kind: ChartKind
  readonly series: readonly number[]
}

/**
 * The marks inside the SVG: a path for a line, a path plus a fill for an area, one rect per value for bars.
 *
 * Three kinds in one component because they share the viewBox and differ only in what they draw into it, and
 * splitting them into three files would put the same six-line preamble in each.
 */
export function ChartMarks({ kind, series }: ChartMarksProps) {
  if (kind === 'bar') {
    return (
      <>
        {chartBars(series).map((bar) => (
          <rect
            data-testid="chart-bar"
            fill="currentColor"
            height={bar.height}
            key={`${bar.x}-${bar.y}`}
            rx="2"
            width={bar.width}
            x={bar.x}
            y={bar.y}
          />
        ))}
      </>
    )
  }

  const points = chartPoints(series)
  const line = linePath(points)

  return (
    <>
      {kind === 'area' && (
        <path
          d={areaPath(points)}
          data-testid="chart-area"
          fill="currentColor"
          opacity={CHART_AREA_OPACITY}
        />
      )}
      <path
        d={line}
        data-testid="chart-line"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        // Without this a stretched viewBox draws a line thicker vertically than horizontally.
        vectorEffect="non-scaling-stroke"
      />
      {/* The vertices, so six values read as six values rather than as one slope. See `dotsPath`. */}
      <path
        d={dotsPath(points)}
        data-testid="chart-dots"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="6"
        vectorEffect="non-scaling-stroke"
      />
    </>
  )
}
