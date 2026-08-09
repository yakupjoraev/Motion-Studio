import { z } from 'zod'

import { visibility } from '../../scales'

/** The status vocabulary the design system already names, plus the neutral one a label usually wants. */
export const BADGE_VARIANTS = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const

export type BadgeVariant = (typeof BADGE_VARIANTS)[number]

export const BADGE_SIZES = ['sm', 'md', 'lg'] as const

export type BadgeSize = (typeof BADGE_SIZES)[number]

export const BADGE_MAX_LENGTH = 48

export const badgeSchema = z.object({
  label: z.string().max(BADGE_MAX_LENGTH).default('New'),
  variant: z.enum(BADGE_VARIANTS).default('accent'),
  size: z.enum(BADGE_SIZES).default('md'),
  /**
   * A dot, not a second colour: the variant already carries the meaning, and the dot is what makes a
   * status badge read as a status rather than as a label. It is decorative and marked so.
   */
  dot: z.boolean().default(false),
  /** An icon name from `packages/icons`. Empty renders no icon rather than a gap. */
  icon: z.string().max(48).default(''),
  hidden: visibility,
})

export type BadgeProps = z.infer<typeof badgeSchema>
