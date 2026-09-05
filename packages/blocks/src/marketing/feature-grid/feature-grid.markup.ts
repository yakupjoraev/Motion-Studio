import { defineMarkup, el } from '@motion-studio/schema'

import { marketingSectionMarkup } from '../marketing-section.markup'
import { nextHeadingLevel } from '../marketing.schema'

import { featureCellMarkup } from './feature-cell.markup'
import { featureGridStyles } from './feature-grid.styles'
import type { FeatureGridProps } from './feature-grid.types'

export const featureGridMarkup = defineMarkup<FeatureGridProps>(
  ({
    props: {
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
    },
  }) =>
    marketingSectionMarkup({
      copy: { eyebrow, heading, description, headingLevel, headingAlign },
      hidden,
      children: [
        el('ul', {
          classNames: [featureGridStyles({ columns: columns as 2 | 3 | 4, narrow })],
          // Matches the component: a scrolling region needs a keyboard route into it (WCAG 2.1.1).
          ...(narrow === 'slider'
            ? { attributes: { tabindex: { kind: 'literal', value: '0' } } }
            : {}),
          children: items.map((feature) =>
            featureCellMarkup({
              feature,
              headingLevel: nextHeadingLevel(headingLevel),
              showIcon: showIcons,
              treatment,
            }),
          ),
        }),
      ],
    }),
)
