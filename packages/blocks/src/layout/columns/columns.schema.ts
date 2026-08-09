import { z } from 'zod'

import { spaceScale, visibility } from '../../scales'

/** The asymmetric splits worth having. Symmetry is `1-1`; the rest are the ones landing pages use. */
export const SPLITS = ['1-1', '2-1', '1-2', '3-1', '1-3'] as const
export const COLUMN_ALIGN = ['start', 'center', 'end', 'stretch'] as const

export type ColumnsSplit = (typeof SPLITS)[number]
export type ColumnsAlign = (typeof COLUMN_ALIGN)[number]

export const columnsSchema = z.object({
  split: z.enum(SPLITS).default('1-1'),
  gap: spaceScale.default('lg'),
  align: z.enum(COLUMN_ALIGN).default('stretch'),
  /**
   * A prop rather than a responsive override: which column reads first on a phone is a semantic
   * decision, and modelling it this way is what makes the export `flex-col-reverse md:grid`.
   */
  reverseOnMobile: z.boolean().default(false),
  hidden: visibility,
})

export type ColumnsProps = z.infer<typeof columnsSchema>
