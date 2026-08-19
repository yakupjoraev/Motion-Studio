import { z } from 'zod'

import {
  CELL_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  SUMMARY_MAX_LENGTH,
  dataFrameFields,
} from '../data.schema'

/** The drawn diameter. The arc's geometry is fixed in the viewBox; this is the box it scales into. */
export const RING_SIZES = ['sm', 'md', 'lg'] as const

export type RingSize = (typeof RING_SIZES)[number]

/** How heavy the arc is, as a scale rather than a number, for the reason ADR-106 gives about classes. */
export const RING_WEIGHTS = ['thin', 'regular', 'thick'] as const

export type RingWeight = (typeof RING_WEIGHTS)[number]

export const progressRingSchema = z.object({
  value: z.number().default(68),
  min: z.number().default(0),
  max: z.number().default(100),
  /** The ring's accessible name. Required, because a progressbar with no name is progress towards nothing. */
  label: z.string().min(1).max(LABEL_MAX_LENGTH).default('Migration progress'),
  /**
   * What a screen reader hears instead of the platform's own arithmetic. Empty computes
   * "68 percent complete", which is right whenever the range is a proportion and wrong when it is a count —
   * that is the case the prop exists for.
   */
  valueText: z.string().max(SUMMARY_MAX_LENGTH).default(''),
  showValue: z.boolean().default(true),
  /** Drawn after the figure in the middle. Never announced: `aria-valuetext` is the announcement. */
  valueUnit: z.string().max(8).default('%'),
  caption: z.string().max(CELL_MAX_LENGTH).default('Blocks migrated'),
  size: z.enum(RING_SIZES).default('md'),
  weight: z.enum(RING_WEIGHTS).default('regular'),
  ...dataFrameFields(),
})

export type ProgressRingProps = z.infer<typeof progressRingSchema>
