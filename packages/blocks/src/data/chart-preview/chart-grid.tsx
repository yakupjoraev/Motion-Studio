import { CHART_VIEWBOX } from './chart-geometry'
import { CHART_GRID_LINE } from './chart-preview.styles'

export interface ChartGridProps {
  readonly ticks: number
}

/**
 * The gridlines, inside the SVG so they scale with the plot and stay aligned with the marks.
 *
 * `vectorEffect="non-scaling-stroke"` keeps them one pixel at every container aspect — the same reason the line
 * carries it. `aria-hidden` is unnecessary: the whole SVG is one `role="img"`, so nothing inside it is exposed.
 */
export function ChartGrid({ ticks }: ChartGridProps) {
  if (ticks < 2) {
    return null
  }

  const { width, height } = CHART_VIEWBOX

  return (
    <g data-testid="chart-grid">
      {Array.from({ length: ticks }, (_, index) => {
        const y = (index / (ticks - 1)) * height

        return (
          <line
            className={CHART_GRID_LINE}
            key={y}
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            x1="0"
            x2={width}
            y1={y}
            y2={y}
          />
        )
      })}
    </g>
  )
}
