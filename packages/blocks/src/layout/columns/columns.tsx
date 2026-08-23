import { Children, type ReactNode } from 'react'

import { COLUMN_CELL, columnsStyles } from './columns.styles'
import type { ColumnsProps } from './columns.types'

/**
 * The slots arrive as `left` and `right` when the host renders by slot, and as two children when it
 * renders positionally — the canvas does the latter today. Reading both keeps the block honest in
 * either host rather than rendering an empty grid in one of them.
 */
export function Columns({
  split,
  gap,
  align,
  reverseOnMobile,
  hidden,
  left,
  right,
  children,
}: ColumnsProps) {
  const [firstChild, secondChild]: readonly ReactNode[] = Children.toArray(children)

  return (
    <div className={columnsStyles({ split, gap, align, reverseOnMobile, hidden })}>
      <div className={COLUMN_CELL}>{left ?? firstChild}</div>
      <div className={COLUMN_CELL}>{right ?? secondChild}</div>
    </div>
  )
}
