import { type MarkupElement, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'
import { marketingSectionMarkup } from '../marketing-section.markup'

import { CELL_WORDS, cellKind } from './comparison-table.schema'
import {
  COMPARISON_CORNER,
  COMPARISON_ROW_HEAD,
  COMPARISON_SCROLLER,
  COMPARISON_TABLE,
  COMPARISON_TEXT,
  comparisonCellStyles,
  comparisonHeadStyles,
  comparisonMarkStyles,
} from './comparison-table.styles'
import type { ComparisonTableProps } from './comparison-table.types'

const cellMarkup = (value: string | undefined, highlighted: boolean): MarkupElement => {
  const kind = cellKind(value)

  return el('td', {
    classNames: [comparisonCellStyles({ highlighted })],
    attributes: { 'data-kind': literal(kind) },
    children: [
      kind === 'yes' || kind === 'no'
        ? el('span', {
            classNames: ['inline-flex items-center justify-center'],
            children: [
              el('span', {
                classNames: [comparisonMarkStyles({ kind })],
                children: [
                  iconMarkup({ name: kind === 'yes' ? 'check' : 'minus', size: 12 }) ?? txt(''),
                ],
              }),
              el('span', { classNames: ['sr-only'], children: [txt(CELL_WORDS[kind])] }),
            ],
          })
        : kind === 'text'
          ? el('span', { classNames: [COMPARISON_TEXT], children: [txt(value ?? '')] })
          : // A row that said nothing about this column. An em dash reads as "not applicable".
            el('span', {
              classNames: [COMPARISON_TEXT],
              attributes: { 'aria-label': literal('Not applicable') },
              children: [txt('—')],
            }),
    ],
  })
}

export const comparisonTableMarkup = defineMarkup<ComparisonTableProps>(
  ({
    props: {
      eyebrow,
      heading,
      description,
      headingLevel,
      headingAlign,
      columns,
      rows,
      regionLabel,
      hidden,
    },
  }) =>
    marketingSectionMarkup({
      copy: { eyebrow, heading, description, headingLevel, headingAlign },
      hidden,
      children: [
        el('section', {
          classNames: [COMPARISON_SCROLLER],
          attributes: { 'aria-label': literal(regionLabel), tabIndex: literal(0) },
          children: [
            el('table', {
              classNames: [COMPARISON_TABLE],
              children: [
                el('caption', { classNames: ['sr-only'], children: [txt(regionLabel)] }),
                el('thead', {
                  children: [
                    el('tr', {
                      children: [
                        el('th', {
                          classNames: [COMPARISON_CORNER],
                          attributes: { scope: literal('col') },
                          children: [
                            el('span', { classNames: ['sr-only'], children: [txt('Feature')] }),
                          ],
                        }),
                        ...columns.map((column) =>
                          el('th', {
                            classNames: [comparisonHeadStyles({ highlighted: column.highlighted })],
                            attributes: {
                              'data-highlighted': literal(column.highlighted),
                              scope: literal('col'),
                            },
                            children: [txt(column.label)],
                          }),
                        ),
                      ],
                    }),
                  ],
                }),
                el('tbody', {
                  children: rows.map((row) =>
                    el('tr', {
                      children: [
                        el('th', {
                          classNames: [COMPARISON_ROW_HEAD],
                          attributes: { scope: literal('row') },
                          children: [txt(row.label)],
                        }),
                        ...columns.map((column, columnIndex) =>
                          cellMarkup(row.values[columnIndex], column.highlighted),
                        ),
                      ],
                    }),
                  ),
                }),
              ],
            }),
          ],
        }),
      ],
    }),
)
