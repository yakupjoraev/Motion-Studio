import type { ReactNode } from 'react'

import type { HeroSplitProps as HeroSplitSchemaProps } from './hero-split.schema'

/** Inferred from the schema, plus the slot. A block never declares its props twice. */
export interface HeroSplitProps extends HeroSplitSchemaProps {
  /** The `media` slot, named. */
  readonly media?: ReactNode
  /** The same slot when the host renders positionally. */
  readonly children?: ReactNode
}
