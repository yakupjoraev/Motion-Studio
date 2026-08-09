import type { ReactNode } from 'react'

import type { StackProps as StackSchemaProps } from './stack.schema'

export interface StackProps extends StackSchemaProps {
  readonly children?: ReactNode
}
