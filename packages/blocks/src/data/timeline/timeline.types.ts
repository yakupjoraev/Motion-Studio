import type { ReactNode } from 'react'

import type { TimelineProps as TimelineSchemaProps } from './timeline.schema'

/** Children fill the steps positionally, falling back to each step's own text — ADR-206. */
export interface TimelineProps extends TimelineSchemaProps {
  readonly children?: ReactNode
}
