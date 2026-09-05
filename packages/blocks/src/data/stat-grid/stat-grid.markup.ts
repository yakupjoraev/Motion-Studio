import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { deltaTone } from '../../content/stat/stat.schema'
import { statDeltaStyles, statValueStyles } from '../../content/stat/stat.styles'
import { dataBlockStyles } from '../data.styles'

import {
  STAT_CELL_HEAD,
  STAT_CELL_LABEL,
  columnsClass,
  statCellStyles,
  statGridStyles,
} from './stat-grid.styles'
import type { StatGridProps } from './stat-grid.types'

/** The arrow is the second signal beside colour, so the direction survives greyscale. */
const ARROWS = { up: '↑', down: '↓' } as const

export const statGridMarkup = defineMarkup<StatGridProps>(
  ({ props: { items, columns, narrow, dividers, size, align, hidden } }) =>
    el('div', {
      classNames: [dataBlockStyles({ hidden })],
      children: [
        el('ul', {
          classNames: [statGridStyles({ dividers, narrow }), columnsClass(columns)],
          // Matches the component: a scrolling region needs a keyboard route in (WCAG 2.1.1).
          ...(narrow === 'slider'
            ? { attributes: { tabindex: { kind: 'literal' as const, value: '0' } } }
            : {}),
          children: items.map((item) =>
            el('li', {
              classNames: [statCellStyles({ align, dividers })],
              children: children(
                el('div', {
                  classNames: [STAT_CELL_HEAD],
                  children: children(
                    el('p', {
                      classNames: [statValueStyles({ size })],
                      children: [txt(item.value)],
                    }),
                    item.delta !== '' &&
                      el('span', {
                        classNames: [
                          statDeltaStyles({
                            tone: deltaTone(item.deltaDirection, item.deltaRose),
                          }),
                        ],
                        children: [
                          el('span', {
                            attributes: { 'aria-hidden': literal('true') },
                            children: [txt(ARROWS[item.deltaRose ? 'up' : 'down'])],
                          }),
                          txt(item.delta),
                        ],
                      }),
                  ),
                }),
                item.label !== '' &&
                  el('p', { classNames: [STAT_CELL_LABEL], children: [txt(item.label)] }),
              ),
            }),
          ),
        }),
      ],
    }),
)
