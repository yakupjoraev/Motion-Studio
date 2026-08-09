import type { ReactNode } from 'react'

import type { SectionProps as SectionSchemaProps } from './section.schema'

/** Inferred from the schema, plus the slot. A block never declares its props twice. */
export interface SectionProps extends SectionSchemaProps {
  readonly children?: ReactNode
}
