import { ChartDataTable } from './chart-data-table'
import { CHART_VIEWBOX, chartSummary } from './chart-geometry'
import { ChartMarks } from './chart-marks'
import { CHART_CAPTION, chartFrameStyles, chartSvgStyles } from './chart-preview.styles'
import type { ChartPreviewProps } from './chart-preview.types'

/**
 * A line, area or bar chart from a numeric array, drawn as inline SVG.
 *
 * **No chart library.** `chart-geometry.ts` is sixty lines of arithmetic, and 34 kB of dependency for a
 * decorative landing-page chart is not a trade PERFORMANCE.md would accept.
 *
 * `role="img"` with a summarising `aria-label`, because that is what the drawing *is* to a screen reader: one
 * thing with one name, not a list of coordinates. The values themselves are beside it in a visually hidden
 * table, so a reader who wants to check the summary can. A chart a screen reader cannot convey is decoration,
 * and this one says what it shows.
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
  caption,
  hidden,
}: ChartPreviewProps) {
  const description = summary === '' ? chartSummary(seriesLabel, series) : summary

  return (
    <figure className={chartFrameStyles({ hidden })} data-testid="chart-preview">
      <svg
        aria-label={description}
        className={chartSvgStyles({ height, tone })}
        data-testid="chart-svg"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${CHART_VIEWBOX.width} ${CHART_VIEWBOX.height}`}
      >
        <ChartMarks kind={kind} series={series} />
      </svg>

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
