import { z } from 'zod'

import { alignment, visibility } from '../../scales'

export const TEXT_SIZES = ['sm', 'md', 'lg', 'xl'] as const

export type TextSize = (typeof TEXT_SIZES)[number]

export const TEXT_TONES = ['default', 'muted', 'subtle'] as const

export type TextTone = (typeof TEXT_TONES)[number]

/**
 * The measure, in characters. 60–75 is the readable range every typographic reference agrees on, and
 * a full-width paragraph at 1440 px is the most common defect in a generated page — so the scale does
 * not offer a value outside it except `full`, which a user has to choose deliberately.
 */
export const MEASURES = ['narrow', 'default', 'wide', 'full'] as const

export type Measure = (typeof MEASURES)[number]

export const MEASURE_CH: Readonly<Record<Measure, number | null>> = {
  narrow: 55,
  default: 68,
  wide: 75,
  full: null,
}

export const TEXT_MAX_LENGTH = 5_000

export const textSchema = z.object({
  text: z
    .string()
    .max(TEXT_MAX_LENGTH)
    .default(
      'A paragraph is the unit a reader actually consumes. Keep it to one idea, keep the measure inside the readable range, and the page reads as though somebody meant it.',
    ),
  size: z.enum(TEXT_SIZES).default('md'),
  tone: z.enum(TEXT_TONES).default('muted'),
  measure: z.enum(MEASURES).default('default'),
  align: alignment.default('start'),
  /** CSS multi-column. Responsive, because two columns at 360 px is one column of four words. */
  columns: z.number().int().min(1).max(3).default(1),
  dropCap: z.boolean().default(false),
  balance: z.boolean().default(false),
  hidden: visibility,
})

export type TextProps = z.infer<typeof textSchema>
