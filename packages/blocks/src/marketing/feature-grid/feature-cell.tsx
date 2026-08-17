import { ICON_REGISTRY, type IconName } from '@motion-studio/icons'

import { CARD_ICON_PLATE, cardStyles } from '../card.styles'
import type { CardTreatment, HeadingLevel } from '../marketing.schema'
import { SectionHeading } from '../section-heading'

import type { Feature } from './feature-grid.schema'
import {
  FEATURE_BODY,
  FEATURE_CELL_BODY,
  FEATURE_CELL_CONTAINER,
  FEATURE_CELL_TEXT,
  FEATURE_TITLE,
} from './feature-grid.styles'

export interface FeatureCellProps {
  readonly feature: Feature
  readonly treatment: CardTreatment
  readonly showIcon: boolean
  readonly headingLevel: HeadingLevel
}

/**
 * One cell: a plate, a title, a sentence.
 *
 * The icon is looked up by name and a name the registry does not know draws nothing — the rule
 * `content/badge` states, and FILE_FORMAT.md § Security is why: a document's string never reaches
 * module resolution.
 */
export function FeatureCell({ feature, treatment, showIcon, headingLevel }: FeatureCellProps) {
  const Icon = ICON_REGISTRY[feature.icon as IconName]

  return (
    <li className={FEATURE_CELL_CONTAINER}>
      <div
        className={cardStyles({ treatment, interactive: treatment !== 'plain' })}
        data-testid="feature-cell"
      >
        <div className={FEATURE_CELL_BODY}>
          {showIcon && Icon !== undefined && (
            <span className={CARD_ICON_PLATE}>
              <Icon aria-hidden="true" size={20} />
            </span>
          )}

          <div className={FEATURE_CELL_TEXT}>
            <SectionHeading className={FEATURE_TITLE} level={headingLevel}>
              {feature.title}
            </SectionHeading>
            <p className={FEATURE_BODY}>{feature.body}</p>
          </div>
        </div>
      </div>
    </li>
  )
}
