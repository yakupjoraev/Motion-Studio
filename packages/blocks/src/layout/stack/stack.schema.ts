import { z } from 'zod'

import { spaceScale, visibility } from '../../scales'

export const STACK_DIRECTIONS = ['vertical', 'horizontal'] as const
export const STACK_ALIGN = ['start', 'center', 'end', 'stretch'] as const
export const STACK_JUSTIFY = ['start', 'center', 'end', 'between'] as const

export type StackDirection = (typeof STACK_DIRECTIONS)[number]
export type StackAlign = (typeof STACK_ALIGN)[number]
export type StackJustify = (typeof STACK_JUSTIFY)[number]

/**
 * A container with one job: put things in a line with a gap. It differs from `container` by the
 * `divider` option, which is the reason a user reaches for a stack rather than a flex box.
 */
export const stackSchema = z.object({
  direction: z.enum(STACK_DIRECTIONS).default('vertical'),
  gap: spaceScale.default('md'),
  align: z.enum(STACK_ALIGN).default('stretch'),
  justify: z.enum(STACK_JUSTIFY).default('start'),
  divider: z.boolean().default(false),
  hidden: visibility,
})

export type StackProps = z.infer<typeof stackSchema>
