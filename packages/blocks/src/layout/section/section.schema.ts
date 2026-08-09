import { z } from 'zod'

import { alignment, maxWidthScale, spaceScale, surfaceToken } from '../../scales'

export const MIN_HEIGHTS = ['auto', 'half', 'three-quarters', 'screen'] as const

export type SectionMinHeight = (typeof MIN_HEIGHTS)[number]

/**
 * The contract, written first — COMPONENT_LIBRARY.md § Adding a block. Every prop carries a default,
 * which is what makes `propsSchema.parse({})` the block's defaults and lets a node store only what
 * the user changed (ADR-104).
 */
export const sectionSchema = z.object({
  maxWidth: maxWidthScale.default('lg'),
  padding: spaceScale.default('lg'),
  background: surfaceToken.default('transparent'),
  align: alignment.default('start'),
  minHeight: z.enum(MIN_HEIGHTS).default('auto'),
})

export type SectionProps = z.infer<typeof sectionSchema>
