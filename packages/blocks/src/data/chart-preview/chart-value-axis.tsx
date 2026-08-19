import { axisTicks, formatTick } from './chart-axis'
import type { ChartKind } from './chart-preview.schema'
import { CHART_AXIS_TEXT, CHART_TICK, CHART_VALUE_AXIS } from './chart-preview.styles'

export interface ChartValueAxisProps {
  readonly kind: ChartKind
  readonly series: readonly number[]
}

/**
 * The value scale, beside the plot.
 *
 * HTML rather than SVG text, and that is forced rather than preferred: the plot's viewBox is drawn with
 * `preserveAspectRatio="none"`, so any text inside it would be stretched horizontally by the container's aspect.
 *
 * A tick has to sit *on* its gridline. `justify-between` puts the three boxes at the top, middle and bottom of the
 * column, which places their centres half a line-height inside the ends — so the first and last are pulled back by
 * exactly that, and the middle one is already right. No coordinate arithmetic and no inline style.
 *
 * `aria-hidden`, because the hidden data table conveys the same values *as a table*; loose numbers in the
 * accessibility tree would be noise a reader has to step over.
 */
export function ChartValueAxis({ kind, series }: ChartValueAxisProps) {
  const ticks = axisTicks(kind, series)

  if (ticks.length < 2) {
    return null
  }

  return (
    <div aria-hidden="true" className={CHART_VALUE_AXIS} data-testid="chart-value-axis">
      {ticks.map((tick) => (
        <span className={`${CHART_TICK} ${CHART_AXIS_TEXT}`} key={tick}>
          {formatTick(tick)}
        </span>
      ))}
    </div>
  )
}
