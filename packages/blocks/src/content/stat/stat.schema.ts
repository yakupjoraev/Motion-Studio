import { z } from 'zod'

import { alignment, visibility } from '../../scales'

export const STAT_SIZES = ['md', 'lg', 'xl'] as const

export type StatSize = (typeof STAT_SIZES)[number]

/** Which way is good. A falling error rate is an improvement, and the block has no way to guess that. */
export const DELTA_DIRECTIONS = ['up-is-good', 'down-is-good', 'neutral'] as const

export type DeltaDirection = (typeof DELTA_DIRECTIONS)[number]

export const LABEL_MAX_LENGTH = 64
export const VALUE_MAX_LENGTH = 24
export const MAX_SERIES_POINTS = 64

export const statSchema = z.object({
  value: z.string().max(VALUE_MAX_LENGTH).default('1.8s'),
  label: z.string().max(LABEL_MAX_LENGTH).default('Median export time'),
  /** Free text, so a percentage, a multiple and an absolute all fit. Empty hides the row. */
  delta: z.string().max(VALUE_MAX_LENGTH).default('−32%'),
  deltaDirection: z.enum(DELTA_DIRECTIONS).default('down-is-good'),
  /** `true` when the delta went up. Which colour that earns is `deltaDirection`'s job, not this one's. */
  deltaRose: z.boolean().default(false),
  series: z.array(z.number()).max(MAX_SERIES_POINTS).default([8, 7, 9, 6, 5, 6, 4, 3, 3, 2]),
  showSparkline: z.boolean().default(true),
  size: z.enum(STAT_SIZES).default('lg'),
  align: alignment.default('start'),
  hidden: visibility,
})

export type StatProps = z.infer<typeof statSchema>

/** The three-way answer the component paints and the test asserts, kept out of the markup. */
export const deltaTone = (
  direction: DeltaDirection,
  rose: boolean,
): 'positive' | 'negative' | 'neutral' => {
  if (direction === 'neutral') {
    return 'neutral'
  }

  const good = direction === 'up-is-good' ? rose : !rose

  return good ? 'positive' : 'negative'
}
