import { z } from 'zod'

import { narrowLayout, spaceScale, visibility } from '../../scales'

export const GRID_MODES = ['explicit', 'auto-fit'] as const

/** ADR-116: a scale, because an arbitrary Tailwind value needs a literal the document cannot give. */
export const MIN_ITEM_WIDTHS = ['sm', 'md', 'lg', 'xl'] as const

export const MAX_COLUMNS = 6

export type GridMode = (typeof GRID_MODES)[number]
export type MinItemWidth = (typeof MIN_ITEM_WIDTHS)[number]

export const gridSchema = z.object({
  mode: z.enum(GRID_MODES).default('explicit'),
  narrow: narrowLayout,
  columns: z.number().int().min(1).max(MAX_COLUMNS).default(3),
  /** Auto-fit only: the width below which a column wraps to the next row. */
  minItemWidth: z.enum(MIN_ITEM_WIDTHS).default('md'),
  gapX: spaceScale.default('md'),
  gapY: spaceScale.default('md'),
  /** Lets a short item fill a hole an earlier tall one left. */
  dense: z.boolean().default(false),
  hidden: visibility,
})

export type GridProps = z.infer<typeof gridSchema>
