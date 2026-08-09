import { z } from 'zod'

import { visibility } from '../../scales'

export const SPACER_MODES = ['fixed', 'fluid'] as const

/** The vertical rhythm of DESIGN_SYSTEM.md § Space, as the steps a spacer is worth having. */
export const SPACER_HEIGHTS = ['sm', 'md', 'lg', 'xl', '2xl'] as const

export type SpacerMode = (typeof SPACER_MODES)[number]
export type SpacerHeight = (typeof SPACER_HEIGHTS)[number]

export const spacerSchema = z.object({
  mode: z.enum(SPACER_MODES).default('fixed'),
  height: z.enum(SPACER_HEIGHTS).default('md'),
  hidden: visibility,
})

export type SpacerProps = z.infer<typeof spacerSchema>
