import type { ReactNode } from 'react'

import type { CarouselProps as CarouselSchemaProps } from './carousel.schema'

/** Children fill the slides positionally, falling back to each slide's own text — ADR-206. */
export interface CarouselProps extends CarouselSchemaProps {
  readonly children?: ReactNode
}
