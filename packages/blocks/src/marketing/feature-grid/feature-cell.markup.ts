import { type MarkupElement, children, el } from '@motion-studio/schema'
import { txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'
import { CARD_ICON_PLATE, cardStyles } from '../card.styles'
import type { CardTreatment, HeadingLevel } from '../marketing.schema'
import { sectionHeadingMarkup } from '../section-heading.markup'

import type { Feature } from './feature-grid.schema'
import {
  FEATURE_BODY,
  FEATURE_CELL_BODY,
  FEATURE_CELL_CONTAINER,
  FEATURE_CELL_TEXT,
  FEATURE_TITLE,
} from './feature-grid.styles'

export interface FeatureCellMarkupInput {
  readonly feature: Feature
  readonly treatment: CardTreatment
  readonly showIcon: boolean
  readonly headingLevel: HeadingLevel
}

export const featureCellMarkup = ({
  feature,
  treatment,
  showIcon,
  headingLevel,
}: FeatureCellMarkupInput): MarkupElement =>
  el('li', {
    classNames: [FEATURE_CELL_CONTAINER],
    children: [
      el('div', {
        classNames: [cardStyles({ treatment, interactive: treatment !== 'plain' })],
        children: [
          el('div', {
            classNames: [FEATURE_CELL_BODY],
            children: children(
              showIcon &&
                iconMarkup({ name: feature.icon, size: 20 }) !== null &&
                el('span', {
                  classNames: [CARD_ICON_PLATE],
                  children: children(iconMarkup({ name: feature.icon, size: 20 })),
                }),
              el('div', {
                classNames: [FEATURE_CELL_TEXT],
                children: [
                  sectionHeadingMarkup({
                    className: FEATURE_TITLE,
                    level: headingLevel,
                    children: [txt(feature.title)],
                  }),
                  el('p', { classNames: [FEATURE_BODY], children: [txt(feature.body)] }),
                ],
              }),
            ),
          }),
        ],
      }),
    ],
  })
