import type { ReactNode } from 'react'

import type { GridProps as GridSchemaProps } from './grid.schema'

export interface GridProps extends GridSchemaProps {
  readonly children?: ReactNode
}
