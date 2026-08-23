import { defineMarkup, el, slot } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'

import { marketingSectionMarkup } from '../marketing-section.markup'

import { bentoCells } from './bento-grid.schema'
import {
  BENTO_CELL_BODY,
  COL_SPAN_CLASS,
  ROW_SPAN_CLASS,
  bentoCellStyles,
  bentoGridStyles,
} from './bento-grid.styles'
import type { BentoGridProps } from './bento-grid.types'

export const bentoGridMarkup = defineMarkup<BentoGridProps>(
  ({
    props: {
      eyebrow,
      heading,
      description,
      headingLevel,
      headingAlign,
      cells,
      gapless,
      cellHeight,
      hidden,
    },
    slots,
  }) =>
    marketingSectionMarkup({
      copy: { eyebrow, heading, description, headingLevel, headingAlign },
      hidden,
      children: [
        el('div', {
          classNames: [bentoGridStyles({ gapless })],
          // The arrangement is the block's; which child lands in which cell is the document's, and a
          // cell is addressed by position — the same index the canvas reads.
          children: bentoCells(cells, slots['children'] ?? 0).map((span, index) =>
            el('div', {
              classNames: [
                cn(
                  bentoCellStyles({ gapless, height: cellHeight }),
                  COL_SPAN_CLASS[span.colSpan as 1 | 2 | 3 | 4],
                  ROW_SPAN_CLASS[span.rowSpan as 1 | 2],
                ),
              ],
              children: [
                el('div', {
                  classNames: [BENTO_CELL_BODY],
                  children: [slot('children', index)],
                }),
              ],
            }),
          ),
        }),
      ],
    }),
)
