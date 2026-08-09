import type { ReactNode } from 'react'

import type { ContainerProps as ContainerSchemaProps } from './container.schema'

export interface ContainerProps extends ContainerSchemaProps {
  readonly children?: ReactNode
}
