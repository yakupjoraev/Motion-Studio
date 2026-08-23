import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { marketingSectionMarkup } from '../marketing-section.markup'
import { type HeadingLevel, nextHeadingLevel } from '../marketing.schema'
import { mediaFrameMarkup } from '../media-frame.markup'
import { sectionHeadingMarkup } from '../section-heading.markup'

import type { FeatureRow } from './feature-split.schema'
import { rowIsReversed } from './feature-split.schema'
import {
  FEATURE_SPLIT_BODY,
  FEATURE_SPLIT_COPY,
  FEATURE_SPLIT_EYEBROW,
  FEATURE_SPLIT_ROW,
  FEATURE_SPLIT_ROWS,
  FEATURE_SPLIT_TITLE,
  featureSplitMediaStyles,
} from './feature-split.styles'
import type { FeatureSplitProps } from './feature-split.types'

const rowMarkup = (
  row: FeatureRow,
  reversed: boolean,
  headingLevel: HeadingLevel,
  priority: boolean,
) =>
  el('li', {
    classNames: [FEATURE_SPLIT_ROW],
    attributes: { 'data-reversed': literal(reversed) },
    children: [
      el('div', {
        classNames: [FEATURE_SPLIT_COPY],
        children: children(
          row.eyebrow !== '' &&
            el('p', { classNames: [FEATURE_SPLIT_EYEBROW], children: [txt(row.eyebrow)] }),
          sectionHeadingMarkup({
            className: FEATURE_SPLIT_TITLE,
            level: headingLevel,
            children: [txt(row.title)],
          }),
          row.body !== '' &&
            el('p', { classNames: [FEATURE_SPLIT_BODY], children: [txt(row.body)] }),
        ),
      }),
      el('div', {
        classNames: [featureSplitMediaStyles({ reversed })],
        children: [mediaFrameMarkup({ media: row.media, priority })],
      }),
    ],
  })

export const featureSplitMarkup = defineMarkup<FeatureSplitProps>(
  ({
    props: { eyebrow, heading, description, headingLevel, headingAlign, alternate, rows, hidden },
  }) =>
    marketingSectionMarkup({
      copy: { eyebrow, heading, description, headingLevel, headingAlign },
      hidden,
      children: [
        el('ul', {
          classNames: [FEATURE_SPLIT_ROWS],
          children: rows.map((row, index) =>
            rowMarkup(
              row,
              rowIsReversed(index, alternate, row.reversed),
              nextHeadingLevel(headingLevel),
              index === 0,
            ),
          ),
        }),
      ],
    }),
)
