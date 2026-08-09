import { z } from 'zod'

import { spaceScale, visibility } from '../../scales'

export const DIVIDER_ORIENTATIONS = ['horizontal', 'vertical'] as const
export const DIVIDER_STYLES = ['solid', 'dashed', 'dotted'] as const

export const DIVIDER_LABEL_MAX = 40

export type DividerOrientation = (typeof DIVIDER_ORIENTATIONS)[number]
export type DividerStyle = (typeof DIVIDER_STYLES)[number]

export const dividerSchema = z.object({
  orientation: z.enum(DIVIDER_ORIENTATIONS).default('horizontal'),
  lineStyle: z.enum(DIVIDER_STYLES).default('solid'),
  /** Non-empty turns the rule into the line-text-line composition. */
  label: z.string().max(DIVIDER_LABEL_MAX).default(''),
  /** Fades the rule out at both ends, which reads as a seam rather than as a cut. */
  fade: z.boolean().default(false),
  spacing: spaceScale.default('md'),
  hidden: visibility,
})

export type DividerProps = z.infer<typeof dividerSchema>
