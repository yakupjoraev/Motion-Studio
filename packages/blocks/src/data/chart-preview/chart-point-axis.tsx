import { pointLabel } from './chart-preview.schema'
import type { ChartKind } from './chart-preview.schema'
import { CHART_AXIS_TEXT, pointAxisStyles, pointLabelStyles } from './chart-preview.styles'

export interface ChartPointAxisProps {
  readonly kind: ChartKind
  readonly series: readonly number[]
  readonly labels: readonly string[]
}

/**
 * The point names, under the plot.
 *
 * They were previously visible only to a screen reader, through the hidden table — an author who named their points
 * got nothing on the page for it. Where a name sits depends on the mark: a line's vertices are *on* the edges of the
 * plot, so the first and last labels align to the ends; a bar occupies a slot, so its label is centred in that slot.
 *
 * `aria-hidden` for the reason the value axis is.
 */
export function ChartPointAxis({ kind, series, labels }: ChartPointAxisProps) {
  if (series.length === 0) {
    return null
  }

  return (
    <div aria-hidden="true" className={pointAxisStyles({ kind })} data-testid="chart-point-axis">
      {series.map((value, index) => (
        <span
          className={`${pointLabelStyles({ kind })} ${CHART_AXIS_TEXT}`}
          key={`${index}-${value}`}
        >
          {pointLabel(labels, index)}
        </span>
      ))}
    </div>
  )
}
