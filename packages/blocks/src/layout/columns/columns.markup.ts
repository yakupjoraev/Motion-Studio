import { defineMarkup, el, slot } from '@motion-studio/schema'

import { COLUMN_CELL, columnsStyles } from './columns.styles'
import type { ColumnsProps } from './columns.types'

/** Two cells, and the document fills each by name — the slots the descriptor declares. */
export const columnsMarkup = defineMarkup<ColumnsProps>(({ props }) =>
  el('div', {
    classNames: [columnsStyles(props)],
    children: [
      el('div', { classNames: [COLUMN_CELL], children: [slot('left')] }),
      el('div', { classNames: [COLUMN_CELL], children: [slot('right')] }),
    ],
  }),
)
