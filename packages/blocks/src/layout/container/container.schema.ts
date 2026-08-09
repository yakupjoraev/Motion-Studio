import { z } from 'zod'

import { maxWidthScale, spaceScale, visibility } from '../../scales'

export const LAYOUT_MODES = ['flex', 'grid'] as const
export const DIRECTIONS = ['row', 'column'] as const
export const CONTAINER_COLUMNS = [1, 2, 3, 4] as const
export const CONTAINER_ALIGN = ['start', 'center', 'end', 'stretch'] as const
export const CONTAINER_JUSTIFY = ['start', 'center', 'end', 'between'] as const

export type ContainerMode = (typeof LAYOUT_MODES)[number]
export type ContainerDirection = (typeof DIRECTIONS)[number]
export type ContainerAlign = (typeof CONTAINER_ALIGN)[number]
export type ContainerJustify = (typeof CONTAINER_JUSTIFY)[number]

/** The block every document starts with — `ROOT_BLOCK_ID` in `schema` names this one. */
export const containerSchema = z.object({
  /** A flex box or a simple grid: the two layouts a generic box is asked for. */
  mode: z.enum(LAYOUT_MODES).default('flex'),
  columns: z.number().int().min(1).max(4).default(2),
  direction: z.enum(DIRECTIONS).default('column'),
  gap: spaceScale.default('md'),
  padding: spaceScale.default('none'),
  align: z.enum(CONTAINER_ALIGN).default('stretch'),
  justify: z.enum(CONTAINER_JUSTIFY).default('start'),
  wrap: z.boolean().default(false),
  maxWidth: maxWidthScale.default('full'),
  /** A rule between the children, on the axis they are laid out along. */
  divide: z.boolean().default(false),
  hidden: visibility,
})

export type ContainerProps = z.infer<typeof containerSchema>
