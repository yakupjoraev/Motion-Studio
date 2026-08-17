import type { HeadingLevel } from '../marketing.schema'
import { MediaFrame } from '../media-frame'
import { SectionHeading } from '../section-heading'

import type { FeatureRow } from './feature-split.schema'
import {
  FEATURE_SPLIT_BODY,
  FEATURE_SPLIT_COPY,
  FEATURE_SPLIT_EYEBROW,
  FEATURE_SPLIT_ROW,
  FEATURE_SPLIT_TITLE,
  featureSplitMediaStyles,
} from './feature-split.styles'

export interface FeatureSplitRowProps {
  readonly row: FeatureRow
  readonly reversed: boolean
  readonly headingLevel: HeadingLevel
  readonly priority: boolean
}

/** One row: copy on one side, a picture on the other, with `order` deciding which side. */
export function FeatureSplitRow({ row, reversed, headingLevel, priority }: FeatureSplitRowProps) {
  return (
    <li className={FEATURE_SPLIT_ROW} data-reversed={reversed} data-testid="feature-split-row">
      <div className={FEATURE_SPLIT_COPY}>
        {row.eyebrow !== '' && <p className={FEATURE_SPLIT_EYEBROW}>{row.eyebrow}</p>}

        <SectionHeading className={FEATURE_SPLIT_TITLE} level={headingLevel}>
          {row.title}
        </SectionHeading>

        {row.body !== '' && <p className={FEATURE_SPLIT_BODY}>{row.body}</p>}
      </div>

      <div className={featureSplitMediaStyles({ reversed })}>
        <MediaFrame media={row.media} priority={priority} testId="feature-split-media" />
      </div>
    </li>
  )
}
