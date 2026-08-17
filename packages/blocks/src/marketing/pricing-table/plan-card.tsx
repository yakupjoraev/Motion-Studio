import type { HeadingLevel } from '../marketing.schema'
import { SectionHeading } from '../section-heading'

import { PlanFeatures } from './plan-features'
import { PlanPrice } from './plan-price'
import type { Interval, Plan } from './pricing-table.schema'
import {
  PLAN_BADGE,
  PLAN_CTA_ROW,
  PLAN_DESCRIPTION,
  PLAN_NAME,
  planCardStyles,
  planCtaStyles,
} from './pricing-table.styles'

export interface PlanCardProps {
  readonly plan: Plan
  readonly currency: string
  readonly interval: Interval
  readonly highlighted: boolean
  readonly glass: boolean
  readonly compact: boolean
  readonly headingLevel: HeadingLevel
}

/**
 * One plan: an `<article>` with a heading, a price, what it includes, and one action.
 *
 * `<article>` because a plan is a self-contained thing a reader can take away on its own, which is what
 * makes it navigable as a region — and the heading is its name, never its price.
 */
export function PlanCard({
  plan,
  currency,
  interval,
  highlighted,
  glass,
  compact,
  headingLevel,
}: PlanCardProps) {
  return (
    <article
      className={planCardStyles({
        surface: glass ? 'glass' : 'card',
        highlighted,
        compact,
      })}
      data-highlighted={highlighted}
      data-testid="plan-card"
    >
      {highlighted && plan.badge !== '' && (
        <span className={PLAN_BADGE} data-testid="plan-badge">
          {plan.badge}
        </span>
      )}

      <SectionHeading className={PLAN_NAME} level={headingLevel}>
        {plan.name}
      </SectionHeading>

      {plan.description !== '' && <p className={PLAN_DESCRIPTION}>{plan.description}</p>}

      <PlanPrice currency={currency} interval={interval} plan={plan} />

      {!compact && <PlanFeatures features={plan.features} />}

      <div className={PLAN_CTA_ROW}>
        <a
          aria-label={`${plan.ctaLabel} — ${plan.name}`}
          className={planCtaStyles({ highlighted })}
          href={plan.ctaHref}
        >
          {plan.ctaLabel}
        </a>
      </div>
    </article>
  )
}
