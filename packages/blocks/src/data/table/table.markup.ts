import { type MarkupChild, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'
import { DATA_EMPTY, DATA_SCROLLER, dataBlockStyles } from '../data.styles'

import { ariaSort } from './table.columns'
import { captionText } from './table.schema'
import {
  EMPTY_CELL,
  TABLE_ELEMENT,
  bodyCellStyles,
  bodyRowStyles,
  captionStyles,
  headerCellStyles,
  sortButtonStyles,
  sortGlyphStyles,
} from './table.styles'
import type { TableProps } from './table.types'

/**
 * The table as it is before anybody sorts it, which is the order the rows are stored in — the model the
 * component builds answers the same thing on its first render, and sorting is behaviour.
 *
 * A cell with nothing in it gets an em dash and the word behind it, the same as on the canvas: an empty
 * cell reads as a rendering bug.
 */
const cellValue = (value: string): readonly MarkupChild[] =>
  value.trim() !== ''
    ? [txt(value)]
    : [
        el('span', { attributes: { 'aria-hidden': literal('true') }, children: [txt('—')] }),
        el('span', { classNames: ['sr-only'], children: [txt('Not applicable')] }),
      ]

export const tableMarkup = defineMarkup<TableProps>(
  ({
    props: {
      caption,
      showCaption,
      columns,
      rows,
      density,
      zebra,
      stickyHeader,
      emptyMessage,
      regionLabel,
      hidden,
    },
  }) =>
    el('div', {
      classNames: [dataBlockStyles({ hidden })],
      children: [
        el('section', {
          classNames: [DATA_SCROLLER],
          attributes: { 'aria-label': literal(regionLabel), tabIndex: literal(0) },
          children: [
            el('table', {
              classNames: [TABLE_ELEMENT],
              children: [
                el('caption', {
                  classNames: [captionStyles({ visible: showCaption })],
                  children: [txt(captionText(caption, regionLabel))],
                }),
                el('thead', {
                  children: [
                    el('tr', {
                      children: columns.map((column) => {
                        const classNames = [
                          headerCellStyles({
                            align: column.align,
                            density,
                            sticky: stickyHeader,
                          }),
                        ]

                        return column.sortable
                          ? el('th', {
                              classNames,
                              attributes: {
                                'aria-sort': literal(ariaSort(true, false) ?? 'none'),
                                scope: literal('col'),
                              },
                              children: [
                                el('button', {
                                  classNames: [sortButtonStyles({ align: column.align })],
                                  attributes: { type: literal('button') },
                                  children: [
                                    txt(column.label),
                                    ...(iconMarkup({
                                      name: 'chevron-up',
                                      size: 14,
                                      className: sortGlyphStyles({ state: 'none' }),
                                    }) === null
                                      ? []
                                      : [
                                          iconMarkup({
                                            name: 'chevron-up',
                                            size: 14,
                                            className: sortGlyphStyles({ state: 'none' }),
                                          }) as MarkupChild,
                                        ]),
                                  ],
                                }),
                              ],
                            })
                          : el('th', {
                              classNames,
                              attributes: { scope: literal('col') },
                              children: [txt(column.label)],
                            })
                      }),
                    }),
                  ],
                }),
                el('tbody', {
                  children:
                    rows.length === 0
                      ? [
                          el('tr', {
                            children: [
                              el('td', {
                                classNames: [EMPTY_CELL, DATA_EMPTY],
                                attributes: { colSpan: literal(columns.length) },
                                children: [txt(emptyMessage)],
                              }),
                            ],
                          }),
                        ]
                      : rows.map((row) =>
                          el('tr', {
                            classNames: [bodyRowStyles({ zebra })],
                            children: columns.map((column, index) =>
                              el('td', {
                                classNames: [bodyCellStyles({ align: column.align, density })],
                                children: cellValue(row.cells[index] ?? ''),
                              }),
                            ),
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
