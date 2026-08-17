import { cn } from '@motion-studio/utils'

import { PlanFeatureMark } from './plan-feature-mark'
import {
  type Interval,
  type Plan,
  featureMatrixRows,
  planIncludes,
  planPrice,
  priceIsNumeric,
} from './pricing-table.schema'
import {
  PRICING_MATRIX,
  PRICING_MATRIX_CELL,
  PRICING_MATRIX_HEAD,
  PRICING_MATRIX_ROW,
  PRICING_MATRIX_SCROLLER,
  PRICING_MATRIX_TD,
  PRICING_MATRIX_TH,
} from './pricing-table.styles'

export interface PricingMatrixProps {
  readonly plans: readonly Plan[]
  readonly currency: string
  readonly interval: Interval
  readonly highlightIndex: number
  readonly caption: string
}

/**
 * The `table` layout, and it is a real `<table>`: rows are features, columns are plans, and the answer in
 * each cell is a relationship between the two. That is what a table is for, and it is what gives a screen
 * reader "Custom themes, Studio, included" instead of a bare tick.
 *
 * The `<caption>` is the accessible name — a table with none is a table a reader arrives at with no idea
 * what it compares. It is visually hidden because the section header above already says it.
 */
export function PricingMatrix({
  plans,
  currency,
  interval,
  highlightIndex,
  caption,
}: PricingMatrixProps) {
  const rows = featureMatrixRows(plans)

  return (
    <div className={PRICING_MATRIX_SCROLLER}>
      <table className={PRICING_MATRIX} data-testid="pricing-matrix">
        <caption className="sr-only">{caption}</caption>
        <thead className={PRICING_MATRIX_HEAD}>
          <tr>
            <th className={PRICING_MATRIX_TH} scope="col">
              <span className="sr-only">Feature</span>
            </th>
            {plans.map((plan, index) => {
              const price = planPrice(plan, interval)

              return (
                <th
                  className={cn(PRICING_MATRIX_TH, 'text-center')}
                  data-highlighted={index === highlightIndex}
                  key={`${plan.name}-${index}`}
                  scope="col"
                >
                  <span className={index === highlightIndex ? 'text-accent' : ''}>{plan.name}</span>
                  <span className="mt-1 block font-normal text-foreground-muted text-base tabular-nums">
                    {priceIsNumeric(price) ? `${currency}${price}` : price}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((label) => (
            <tr className={PRICING_MATRIX_ROW} key={label}>
              <th className={cn(PRICING_MATRIX_TD, 'font-normal')} scope="row">
                {label}
              </th>
              {plans.map((plan, index) => {
                const included = planIncludes(plan, label)

                return (
                  <td className={PRICING_MATRIX_CELL} key={`${plan.name}-${index}`}>
                    <span className="inline-flex items-center justify-center">
                      <PlanFeatureMark included={included === true} />
                      <span className="sr-only">
                        {included === true ? 'Included' : 'Not included'}
                      </span>
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
