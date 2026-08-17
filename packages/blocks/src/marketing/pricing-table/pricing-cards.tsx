import type { HeadingLevel } from '../marketing.schema'

import { PlanCard } from './plan-card'
import type { Interval, Plan } from './pricing-table.schema'
import { pricingGridStyles } from './pricing-table.styles'

export interface PricingCardsProps {
  readonly plans: readonly Plan[]
  readonly currency: string
  readonly interval: Interval
  readonly highlightIndex: number
  readonly glass: boolean
  readonly compact: boolean
  readonly headingLevel: HeadingLevel
}

/**
 * The `cards` and `compact` layouts: one grid, one column per plan, tracks stepping down so four plans
 * are two-by-two on a tablet and a stack on a phone. `compact` drops the feature lists and tightens the
 * padding — the row a page uses when the details live in a matrix further down.
 */
export function PricingCards({
  plans,
  currency,
  interval,
  highlightIndex,
  glass,
  compact,
  headingLevel,
}: PricingCardsProps) {
  return (
    <div
      className={pricingGridStyles({
        columns: Math.min(plans.length, 4) as 1 | 2 | 3 | 4,
        layout: compact ? 'compact' : 'cards',
      })}
    >
      {plans.map((plan, index) => (
        <PlanCard
          compact={compact}
          currency={currency}
          glass={glass}
          headingLevel={headingLevel}
          highlighted={index === highlightIndex}
          interval={interval}
          key={`${plan.name}-${index}`}
          plan={plan}
        />
      ))}
    </div>
  )
}
