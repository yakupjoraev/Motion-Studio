import { PlanFeatureMark } from './plan-feature-mark'
import type { PlanFeature } from './pricing-table.schema'
import { PLAN_FEATURES, planFeatureStyles } from './pricing-table.styles'

export interface PlanFeaturesProps {
  readonly features: readonly PlanFeature[]
}

/** The plan's feature list. A `<ul>`, so a reader hears how long it is before hearing the first item. */
export function PlanFeatures({ features }: PlanFeaturesProps) {
  if (features.length === 0) {
    return null
  }

  return (
    <ul className={PLAN_FEATURES} data-testid="plan-features">
      {features.map((feature, index) => (
        <li
          className={planFeatureStyles({ included: feature.included })}
          key={`${feature.label}-${index}`}
        >
          <PlanFeatureMark included={feature.included} />
          <span>
            {feature.label}
            {/* The word an icon cannot carry. Off screen, so the list reads clean and the answer is
                still in the accessibility tree for the rows that say "no". */}
            {!feature.included && <span className="sr-only"> — not included</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}
