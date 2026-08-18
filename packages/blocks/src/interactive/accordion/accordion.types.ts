import type { ReactNode } from 'react'

import type { AccordionProps as AccordionSchemaProps } from './accordion.schema'

/** Children fill the panels positionally, falling back to each row's own text — ADR-206. */
export interface AccordionProps extends AccordionSchemaProps {
  readonly children?: ReactNode
}
