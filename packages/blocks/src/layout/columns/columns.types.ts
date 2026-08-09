import type { ReactNode } from 'react'

import type { ColumnsProps as ColumnsSchemaProps } from './columns.schema'

/**
 * Two named slots rather than one slot with two children — the drop indicator can then highlight the
 * column a block is going into instead of drawing an insertion line in an ambiguous list.
 */
export interface ColumnsProps extends ColumnsSchemaProps {
  readonly left?: ReactNode
  readonly right?: ReactNode
  /** What the canvas passes when it renders children positionally rather than by slot. */
  readonly children?: ReactNode
}
