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
  narrow,
  treatment,
  showIcons,
  items,
  hidden,
}: FeatureGridProps) {
  const copy = { eyebrow, heading, description, headingLevel, headingAlign }

  return (
    <MarketingSection copy={copy} hidden={hidden} testId="feature-grid">
      {/*
       * `tabIndex` on the list, not on a wrapper: when `narrow` is `slider` this element scrolls, and
       * WCAG 2.1.1 asks that a scrollable region be reachable without a pointer. It costs a tab stop
       * in the grid arrangement, which is the cheaper of the two prices.
       */}
      <ul
        className={featureGridStyles({ columns: columns as 2 | 3 | 4, narrow })}
        tabIndex={narrow === 'slider' ? 0 : undefined}
      >
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
