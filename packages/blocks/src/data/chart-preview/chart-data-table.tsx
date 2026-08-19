import { pointLabel } from './chart-preview.schema'

export interface ChartDataTableProps {
  readonly summary: string
  readonly seriesLabel: string
  readonly series: readonly number[]
  readonly labels: readonly string[]
}

/**
 * The real values, as a table only a screen reader reads.
 *
 * `sr-only` rather than `aria-hidden`'s opposite: the drawing carries an `aria-label` that summarises the
 * series, and this is what lets a reader who wants the numbers have them. A chart whose only accessible form
 * is a one-sentence summary is a chart a reader has to take on trust.
 *
 * The caption is the summary, so the table and the drawing say the same thing before the rows begin.
 *
 * `sr-only` is on a **wrapper**, not on the table, and that is measured rather than stylistic: the utility sets
 * `width: 1px`, which a `display: table` box treats as a minimum and ignores, so the table laid itself out at its
 * content width and pushed the page 6 px wide at 360 px. A 1 px wrapper with `overflow: hidden` clips it and
 * contributes nothing to the document's scroll width — ADR-222.
 */
export function ChartDataTable({ summary, seriesLabel, series, labels }: ChartDataTableProps) {
  return (
    <div className="sr-only" data-testid="chart-table-shell">
      <table data-testid="chart-table">
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th scope="col">Point</th>
            <th scope="col">{seriesLabel}</th>
          </tr>
        </thead>
        <tbody>
          {series.map((value, index) => (
            <tr key={`${index}-${value}`}>
              <th scope="row">{pointLabel(labels, index)}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
