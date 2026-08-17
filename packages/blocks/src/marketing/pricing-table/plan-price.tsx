import { type Interval, type Plan, planPrice, priceIsNumeric } from './pricing-table.schema'
import { PLAN_CURRENCY, PLAN_INTERVAL, PLAN_PRICE, PLAN_PRICE_ROW } from './pricing-table.styles'

export interface PlanPriceProps {
  readonly plan: Plan
  readonly currency: string
  readonly interval: Interval
}

const SUFFIX = { month: '/month', year: '/year' } as const

/**
 * The price, and it is a `<p>` rather than a heading: prompt 38 says so and the reason is the document
 * outline — a page whose headings are "Free", "$0", "Studio", "$19" has an outline that says nothing.
 * The plan's name is the heading; the price is its most prominent piece of text, which is typography.
 *
 * `key` is the interval, so React replaces the element and `ms-price-swap` plays on the new number.
 * A non-numeric price — `Free`, `Custom` — takes neither the currency nor the suffix, because "$Custom
 * /month" is not a price anybody writes.
 */
export function PlanPrice({ plan, currency, interval }: PlanPriceProps) {
  const price = planPrice(plan, interval)
  const numeric = priceIsNumeric(price)

  return (
    <p className={PLAN_PRICE_ROW} data-testid="plan-price">
      <span className={PLAN_PRICE} key={interval}>
        {numeric && currency !== '' && <span className={PLAN_CURRENCY}>{currency}</span>}
        {price}
      </span>
      {numeric && <span className={PLAN_INTERVAL}>{SUFFIX[interval]}</span>}
    </p>
  )
}
