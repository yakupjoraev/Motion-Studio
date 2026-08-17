import { MarketingSection } from '../marketing-section'
import { nextHeadingLevel } from '../marketing.schema'

import { FeatureCell } from './feature-cell'
import { featureGridStyles } from './feature-grid.styles'
import type { FeatureGridProps } from './feature-grid.types'

/**
 * A grid of features: icon, title, one sentence each.
 *
 * The list is a `<ul>` because it is one — six unordered peers — and that is what lets a screen reader
 * say "list, 6 items" before the first title instead of reading six unrelated headings.
 */
export function FeatureGrid({
  eyebrow,
  heading,
  description,
  headingLevel,
  headingAlign,
  columns,
  treatment,
  showIcons,
  items,
  hidden,
}: FeatureGridProps) {
  const copy = { eyebrow, heading, description, headingLevel, headingAlign }

  return (
    <MarketingSection copy={copy} hidden={hidden} testId="feature-grid">
      <ul className={featureGridStyles({ columns: columns as 2 | 3 | 4 })}>
        {items.map((feature, index) => (
          <FeatureCell
            feature={feature}
            headingLevel={nextHeadingLevel(headingLevel)}
            key={`${feature.title}-${index}`}
            showIcon={showIcons}
            treatment={treatment}
          />
        ))}
      </ul>
    </MarketingSection>
  )
}
