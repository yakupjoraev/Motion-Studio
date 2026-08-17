import { MarketingSection } from '../marketing-section'

import { ComparisonCell } from './comparison-cell'
import {
  COMPARISON_CORNER,
  COMPARISON_ROW_HEAD,
  COMPARISON_SCROLLER,
  COMPARISON_TABLE,
  comparisonHeadStyles,
} from './comparison-table.styles'
import type { ComparisonTableProps } from './comparison-table.types'

/**
 * A feature matrix with a sticky header row and a sticky first column.
 *
 * Both axes stick, which needs three things to be right at once and is why most implementations only manage
 * one: `position: sticky` on the header cells *and* on the row headers, a `z-index` ladder where the corner
 * outranks both (see the styles), and `border-separate` so a stuck cell carries its own edges.
 *
 * The scroller is a labelled `role="region"` with `tabindex="0"`, so a keyboard reader can reach it and
 * scroll it with the arrow keys — a scrollable box that cannot take focus is a box only a pointer can read.
 */
export function ComparisonTable({
  eyebrow,
  heading,
  description,
  headingLevel,
  headingAlign,
  columns,
  rows,
  regionLabel,
  hidden,
}: ComparisonTableProps) {
  const copy = { eyebrow, heading, description, headingLevel, headingAlign }

  return (
    <MarketingSection copy={copy} hidden={hidden} testId="comparison-table">
      {/*
       * A `<section>` rather than a div with `role="region"`, which is what the rule asks for and what the
       * element means: a labelled region.
       *
       * `tabIndex` on it is deliberate and it is not a keyboard trap. WAI's own guidance for a scrollable
       * region is exactly this — a container that scrolls but cannot take focus cannot be scrolled without
       * a pointer, which is the defect this attribute exists to prevent. The element gains no other
       * interactive behaviour and its own focus ring comes from the block.
       */}
      <section
        aria-label={regionLabel}
        className={COMPARISON_SCROLLER}
        data-testid="comparison-scroller"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region has to be focusable, or it cannot be scrolled without a pointer
        tabIndex={0}
      >
        <table className={COMPARISON_TABLE} data-testid="comparison-grid">
          <caption className="sr-only">{regionLabel}</caption>
          <thead>
            <tr>
              <th className={COMPARISON_CORNER} data-testid="comparison-corner" scope="col">
                <span className="sr-only">Feature</span>
              </th>
              {columns.map((column, index) => (
                <th
                  className={comparisonHeadStyles({ highlighted: column.highlighted })}
                  data-highlighted={column.highlighted}
                  data-testid="comparison-head"
                  key={`${column.label}-${index}`}
                  scope="col"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${row.label}-${rowIndex}`}>
                <th className={COMPARISON_ROW_HEAD} data-testid="comparison-row-head" scope="row">
                  {row.label}
                </th>
                {columns.map((column, columnIndex) => (
                  <ComparisonCell
                    highlighted={column.highlighted}
                    key={`${column.label}-${columnIndex}`}
                    value={row.values[columnIndex]}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </MarketingSection>
  )
}
