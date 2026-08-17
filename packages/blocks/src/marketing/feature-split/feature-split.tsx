import { MarketingSection } from '../marketing-section'
import { nextHeadingLevel } from '../marketing.schema'

import { FeatureSplitRow } from './feature-split-row'
import { rowIsReversed } from './feature-split.schema'
import { FEATURE_SPLIT_ROWS } from './feature-split.styles'
import type { FeatureSplitProps } from './feature-split.types'

/**
 * Alternating text-and-media rows.
 *
 * The first row's picture is the one that can win LCP — it is the largest contentful thing in the
 * section and often above the fold on a short page — so it is requested eagerly and the rest are lazy.
 * PERFORMANCE.md § Images: an honest priority hint on exactly one image beats a page of eager ones.
 */
export function FeatureSplit({
  eyebrow,
  heading,
  description,
  headingLevel,
  headingAlign,
  alternate,
  rows,
  hidden,
}: FeatureSplitProps) {
  const copy = { eyebrow, heading, description, headingLevel, headingAlign }

  return (
    <MarketingSection copy={copy} hidden={hidden} testId="feature-split">
      <ul className={FEATURE_SPLIT_ROWS}>
        {rows.map((row, index) => (
          <FeatureSplitRow
            headingLevel={nextHeadingLevel(headingLevel)}
            key={`${row.title}-${index}`}
            priority={index === 0}
            reversed={rowIsReversed(index, alternate, row.reversed)}
            row={row}
          />
        ))}
      </ul>
    </MarketingSection>
  )
}
