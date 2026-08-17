import type { ReactNode } from 'react'

import type { BentoGridProps as BentoGridSchemaProps } from './bento-grid.schema'

/** The cells are children, so the block takes them the way every container block does. */
export type BentoGridProps = BentoGridSchemaProps & {
  readonly children?: ReactNode
}
