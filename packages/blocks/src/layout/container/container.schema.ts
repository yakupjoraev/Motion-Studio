import { z } from 'zod'

import { maxWidthScale, spaceScale } from '../../scales'

export const DIRECTIONS = ['row', 'column'] as const
export const CONTAINER_ALIGN = ['start', 'center', 'end', 'stretch'] as const
export const CONTAINER_JUSTIFY = ['start', 'center', 'end', 'between'] as const

export type ContainerDirection = (typeof DIRECTIONS)[number]
export type ContainerAlign = (typeof CONTAINER_ALIGN)[number]
export type ContainerJustify = (typeof CONTAINER_JUSTIFY)[number]

/** The block every document starts with — `ROOT_BLOCK_ID` in `schema` names this one. */
export const containerSchema = z.object({
  direction: z.enum(DIRECTIONS).default('column'),
  gap: spaceScale.default('md'),
  padding: spaceScale.default('none'),
  align: z.enum(CONTAINER_ALIGN).default('stretch'),
  justify: z.enum(CONTAINER_JUSTIFY).default('start'),
  wrap: z.boolean().default(false),
  maxWidth: maxWidthScale.default('full'),
})

export type ContainerProps = z.infer<typeof containerSchema>
