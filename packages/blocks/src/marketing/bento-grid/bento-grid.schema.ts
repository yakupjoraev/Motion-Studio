import { z } from 'zod'

import { narrowLayout } from '../../scales'

import { sectionCopyFields, sectionFrameFields } from '../marketing.schema'

export const MAX_CELLS = 8
export const MAX_COL_SPAN = 4
export const MAX_ROW_SPAN = 2

export const CELL_HEIGHTS = ['sm', 'md', 'lg'] as const

export type CellHeight = (typeof CELL_HEIGHTS)[number]

export const bentoCellSchema = z.object({
  colSpan: z.number().int().min(1).max(MAX_COL_SPAN).default(1),
  rowSpan: z.number().int().min(1).max(MAX_ROW_SPAN).default(1),
})

export type BentoCell = z.infer<typeof bentoCellSchema>

/** The shape prompt 38 calls asymmetric: a wide opener, two squares, a tall one, a wide closer. */
const DEFAULT_CELLS: readonly BentoCell[] = [
  { colSpan: 2, rowSpan: 2 },
  { colSpan: 2, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 2, rowSpan: 1 },
  { colSpan: 2, rowSpan: 1 },
]

export const bentoGridSchema = z.object({
  ...sectionCopyFields({
    eyebrow: '',
    heading: 'Everything in one view',
    description: '',
  }),
  cells: z
    .array(bentoCellSchema)
    .min(1)
    .max(MAX_CELLS)
    .default([...DEFAULT_CELLS]),
  /**
   * Cells sharing a hairline instead of a gap. The look most bento implementations miss, and the one
   * that makes a grid read as a single panel rather than as a tray of cards.
   */
  gapless: z.boolean().default(false),
  narrow: narrowLayout,
  cellHeight: z.enum(CELL_HEIGHTS).default('md'),
  ...sectionFrameFields(),
})

export type BentoGridProps = z.infer<typeof bentoGridSchema>

const UNIT: BentoCell = { colSpan: 1, rowSpan: 1 }

/**
 * The spans the grid actually draws.
 *
 * A child with no entry in `cells` gets a single unit rather than being dropped: the alternative is a
 * block that silently stops rendering the seventh thing a user put in it. A `cells` entry with no child
 * still draws its cell, because the empty cell is how a user arranges the composition *before* filling
 * it in.
 */
export function bentoCells(cells: readonly BentoCell[], childCount: number): readonly BentoCell[] {
  const length = Math.max(cells.length, Math.min(childCount, MAX_CELLS))

  return Array.from({ length }, (_, index) => cells[index] ?? UNIT)
}
