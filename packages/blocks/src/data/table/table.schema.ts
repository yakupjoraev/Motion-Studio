import { z } from 'zod'

import { alignment } from '../../scales'
import {
  CAPTION_MAX_LENGTH,
  CELL_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  density,
  scrollRegionFields,
} from '../data.schema'

export const MAX_TABLE_COLUMNS = 8
export const MAX_TABLE_ROWS = 50

export const tableColumnSchema = z.object({
  label: z.string().min(1).max(LABEL_MAX_LENGTH),
  align: alignment.default('start'),
  /** Per column, not per table: a column of free text sorts into an order nobody asked for. */
  sortable: z.boolean().default(true),
})

export type TableColumn = z.infer<typeof tableColumnSchema>

/**
 * A row is its cells, in column order, and a cell is a string. The same shape `comparison-table` settled
 * on and for the same reason: a `string | number` union makes every consumer branch on the type of a value
 * the document stores, and a number typed by a user indistinguishable from a mistake. Sorting reads the
 * string with an alphanumeric comparator, so `9` still lands before `10`.
 */
export const tableRowSchema = z.object({
  cells: z.array(z.string().max(CELL_MAX_LENGTH)).max(MAX_TABLE_COLUMNS).default([]),
})

export type TableRow = z.infer<typeof tableRowSchema>

const row = (...cells: readonly string[]): TableRow => ({ cells: [...cells] })

const DEFAULT_ROWS: readonly TableRow[] = [
  row('landing-page.motion', 'React', '18', '1.4s', 'Complete'),
  row('pricing-grid.motion', 'Next.js', '24', '2.1s', 'Complete'),
  row('docs-shell.motion', 'HTML', '9', '0.6s', 'Complete'),
  row('changelog.motion', 'React', '31', '2.8s', 'Failed'),
  row('brand-kit.motion', 'JSON', '4', '0.2s', 'Complete'),
]

export const tableSchema = z.object({
  /**
   * The table's accessible name. Empty falls back to the region label rather than to nothing, because a
   * table with no accessible name is a screen-reader dead end — the caption element is always rendered.
   */
  caption: z.string().max(CAPTION_MAX_LENGTH).default('Export runs, last seven days'),
  showCaption: z.boolean().default(false),
  columns: z
    .array(tableColumnSchema)
    .min(1)
    .max(MAX_TABLE_COLUMNS)
    .default([
      { label: 'Document', align: 'start', sortable: true },
      { label: 'Target', align: 'start', sortable: true },
      { label: 'Nodes', align: 'end', sortable: true },
      { label: 'Duration', align: 'end', sortable: true },
      { label: 'Result', align: 'start', sortable: false },
    ]),
  rows: z
    .array(tableRowSchema)
    .max(MAX_TABLE_ROWS)
    .default([...DEFAULT_ROWS]),
  density: density.default('default'),
  zebra: z.boolean().default(true),
  stickyHeader: z.boolean().default(true),
  emptyMessage: z.string().max(CAPTION_MAX_LENGTH).default('No exports yet.'),
  ...scrollRegionFields('Export runs'),
})

export type TableProps = z.infer<typeof tableSchema>

/** The name the caption carries. Never empty — that is the whole point of the fallback. */
export const captionText = (caption: string, regionLabel: string): string =>
  caption.trim() === '' ? regionLabel : caption

/**
 * The id a column is addressed by inside the table model. Derived from the index rather than from the
 * label, because two columns may legitimately share a heading and a duplicate id would make one of them
 * unsortable.
 */
export const columnId = (index: number): string => `column-${index}`
