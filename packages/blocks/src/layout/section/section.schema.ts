import { z } from 'zod'

import {
  MIN_HEIGHT_SCALE,
  alignment,
  maxWidthScale,
  spaceScale,
  surfaceToken,
  visibility,
} from '../../scales'

/** The scale is shared vocabulary now that the hero band uses it too — `scales.ts` owns it. */
export const MIN_HEIGHTS = MIN_HEIGHT_SCALE

export type SectionMinHeight = (typeof MIN_HEIGHTS)[number]

export const OVERFLOW = ['visible', 'hidden', 'clip'] as const

export type SectionOverflow = (typeof OVERFLOW)[number]

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
  /** The band sticks to the top of the viewport while the page scrolls past it. */
  sticky: z.boolean().default(false),
  /**
   * The background runs the full width of the viewport while the content keeps its measure — the
   * band is already full width, so this is what makes the measure independent of it.
   */
  fullBleed: z.boolean().default(true),
  overflow: z.enum(OVERFLOW).default('visible'),
  hidden: visibility,
})

export type SectionProps = z.infer<typeof sectionSchema>
