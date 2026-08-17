import { cn } from '@motion-studio/utils'
import type { ReactNode } from 'react'

import type { BentoCell as BentoCellSpan, CellHeight } from './bento-grid.schema'
import {
  BENTO_CELL_BODY,
  COL_SPAN_CLASS,
  ROW_SPAN_CLASS,
  bentoCellStyles,
} from './bento-grid.styles'

export interface BentoCellProps {
  readonly span: BentoCellSpan
  readonly gapless: boolean
  readonly height: CellHeight
  readonly children: ReactNode
}

/**
 * One cell of the composition, and the container-query scope for whatever is in it
 * (`capabilities.containerQuery`, ADR-184). A cell that spans two of four tracks is twice the width of
 * its neighbour at the same viewport, which is exactly the case a viewport query cannot see.
 */
export function BentoCell({ span, gapless, height, children }: BentoCellProps) {
  const className = cn(
    bentoCellStyles({ gapless, height }),
    COL_SPAN_CLASS[span.colSpan as 1 | 2 | 3 | 4],
    ROW_SPAN_CLASS[span.rowSpan as 1 | 2],
  )

  return (
    <div className={className} data-testid="bento-cell">
      <div className={BENTO_CELL_BODY}>{children}</div>
    </div>
  )
}
