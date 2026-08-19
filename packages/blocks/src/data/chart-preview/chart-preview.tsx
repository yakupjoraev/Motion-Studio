import { AXIS_TICKS } from './chart-axis'
import { ChartDataTable } from './chart-data-table'
import { CHART_VIEWBOX, chartSummary } from './chart-geometry'
import { ChartGrid } from './chart-grid'
import { ChartMarks } from './chart-marks'
import { ChartPointAxis } from './chart-point-axis'
import {
  CHART_CAPTION,
  CHART_LAYOUT,
  chartFrameStyles,
  chartSvgStyles,
} from './chart-preview.styles'
import type { ChartPreviewProps } from './chart-preview.types'
import { ChartValueAxis } from './chart-value-axis'

/**
 * A line, area or bar chart from a numeric array, drawn as inline SVG.
 *
 * **No chart library.** `chart-geometry.ts` and `chart-axis.ts` are ninety lines of arithmetic between them, and
 * 34 kB of dependency for a landing-page chart is not a trade PERFORMANCE.md would accept.
 *
 * `role="img"` with a summarising `aria-label`, because that is what the drawing *is* to a screen reader: one thing
 * with one name, not a list of coordinates. The values themselves are beside it in a visually hidden table, so a
 * reader who wants to check the summary can. A chart a screen reader cannot convey is decoration, and this one says
 * what it shows.
 *
 * Both axes are HTML rather than SVG text, and that is forced by the drawing: the viewBox is stretched with
 * `preserveAspectRatio="none"`, which would stretch any text inside it. They are `aria-hidden`, because the hidden
 * table already carries the same numbers as a table rather than as a scatter of digits.
 */
export function ChartPreview({
  series,
  labels,
  kind,
  tone,
  height,
  seriesLabel,
  summary,
  showTable,
  showGrid,
  showPointLabels,
  plate,
  caption,
  hidden,
}: ChartPreviewProps) {
  const description = summary === '' ? chartSummary(seriesLabel, series) : summary

  return (
    <figure className={chartFrameStyles({ hidden, plate })} data-testid="chart-preview">
      <div className={CHART_LAYOUT}>
        {showGrid && <ChartValueAxis kind={kind} series={series} />}

        <svg
          aria-label={description}
          className={`${chartSvgStyles({ height, tone })} col-start-2`}
          data-testid="chart-svg"
          preserveAspectRatio="none"
          role="img"
          viewBox={`0 0 ${CHART_VIEWBOX.width} ${CHART_VIEWBOX.height}`}
        >
          {showGrid && <ChartGrid ticks={AXIS_TICKS} />}
          <ChartMarks kind={kind} series={series} />
        </svg>

        {showPointLabels && <ChartPointAxis kind={kind} labels={labels} series={series} />}
      </div>

      {showTable && (
        <ChartDataTable
          labels={labels}
          series={series}
          seriesLabel={seriesLabel}
          summary={description}
        />
      )}

      {caption !== '' && <figcaption className={CHART_CAPTION}>{caption}</figcaption>}
    </figure>
  )
}
