import { z } from 'zod'

import {
  BODY_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  sectionCopyFields,
  sectionFrameFields,
} from '../marketing.schema'

export const COMPARISON_MAX_COLUMNS = 5
export const COMPARISON_MAX_ROWS = 16

/**
 * A cell is a string, and `yes` / `no` are the two strings that render as a mark instead of as text.
 *
 * The alternative — a `boolean | string` union — makes every consumer branch on the type of a value the
 * document stores, and makes `yes` typed by a user indistinguishable from a mistake. Two reserved words
 * are checkable, documented in the control's hint, and survive a round trip through the file format.
 */
export const CELL_YES = 'yes'
export const CELL_NO = 'no'

export const comparisonRowSchema = z.object({
  label: z.string().max(TITLE_MAX_LENGTH).default('A feature worth comparing'),
  /** One value per column, in column order. A missing entry renders as an em dash. */
  values: z.array(z.string().max(BODY_MAX_LENGTH)).max(COMPARISON_MAX_COLUMNS).default([]),
})

export type ComparisonRow = z.infer<typeof comparisonRowSchema>

export const comparisonColumnSchema = z.object({
  label: z.string().max(LABEL_MAX_LENGTH).default('Column'),
  /** The column the page is selling. Gets the accent treatment and stays legible without colour. */
  highlighted: z.boolean().default(false),
})

export type ComparisonColumn = z.infer<typeof comparisonColumnSchema>

const DEFAULT_COLUMNS: readonly ComparisonColumn[] = [
  { label: 'Motion Studio', highlighted: true },
  { label: 'Design tool', highlighted: false },
  { label: 'Page builder', highlighted: false },
]

const row = (label: string, values: readonly string[]): ComparisonRow => ({
  label,
  values: [...values],
})

const DEFAULT_ROWS: readonly ComparisonRow[] = [
  row('Exports real components', [CELL_YES, CELL_NO, CELL_NO]),
  row('Motion presets', ['51', 'Hand-built', 'A few']),
  row('Reduced motion honoured', [CELL_YES, CELL_NO, CELL_NO]),
  row('Owns your markup', [CELL_NO, CELL_NO, CELL_YES]),
  row('Runs in the browser', [CELL_YES, CELL_NO, CELL_YES]),
  row('Typed props', [CELL_YES, CELL_NO, CELL_NO]),
]

export const comparisonTableSchema = z.object({
  ...sectionCopyFields({
    eyebrow: '',
    heading: 'How it compares',
    description: '',
  }),
  columns: z
    .array(comparisonColumnSchema)
    .min(1)
    .max(COMPARISON_MAX_COLUMNS)
    .default([...DEFAULT_COLUMNS]),
  rows: z
    .array(comparisonRowSchema)
    .min(1)
    .max(COMPARISON_MAX_ROWS)
    .default([...DEFAULT_ROWS]),
  /** The label on the scrollable region, read when a keyboard user tabs into it. */
  regionLabel: z.string().max(LABEL_MAX_LENGTH).default('Feature comparison'),
  ...sectionFrameFields(),
})

export type ComparisonTableProps = z.infer<typeof comparisonTableSchema>

export type CellKind = 'yes' | 'no' | 'text' | 'empty'

/** What a cell is: a mark, some text, or nothing the row said about this column. */
export function cellKind(value: string | undefined): CellKind {
  if (value === undefined || value.trim() === '') {
    return 'empty'
  }

  if (value === CELL_YES) {
    return 'yes'
  }

  if (value === CELL_NO) {
    return 'no'
  }

  return 'text'
}

/** What a yes or a no is said with behind the glyph, so a cell announces an answer. */
export const CELL_WORDS = { yes: 'Yes', no: 'No' } as const
