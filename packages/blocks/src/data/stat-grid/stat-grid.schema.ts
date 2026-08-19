import { z } from 'zod'

import { DELTA_DIRECTIONS, STAT_SIZES } from '../../content/stat/stat.schema'
import { alignment } from '../../scales'
import { CELL_MAX_LENGTH, LABEL_MAX_LENGTH, dataFrameFields } from '../data.schema'

export const MAX_STATS = 8
export const MIN_STATS = 1

/** Two is the fewest that reads as a grid; five figures in a row are five figures nobody compares. */
export const MIN_COLUMNS = 2
export const MAX_COLUMNS = 4

/**
 * One figure.
 *
 * `deltaDirection` and `deltaRose` are `content/stat`'s two props under `content/stat`'s names, imported
 * rather than restated: whether a change is good is one decision (a falling error rate is an improvement)
 * and a second copy of the three-way answer would be a second thing to get wrong.
 */
export const statItemSchema = z.object({
  value: z.string().min(1).max(LABEL_MAX_LENGTH),
  label: z.string().max(CELL_MAX_LENGTH).default(''),
  /** Free text, so a percentage, a multiple and an absolute all fit. Empty hides the row. */
  delta: z.string().max(LABEL_MAX_LENGTH).default(''),
  deltaDirection: z.enum(DELTA_DIRECTIONS).default('up-is-good'),
  /** `true` when the delta went up. Which colour that earns is `deltaDirection`'s job, not this one's. */
  deltaRose: z.boolean().default(true),
})

export type StatItem = z.infer<typeof statItemSchema>

const DEFAULT_ITEMS: readonly StatItem[] = [
  {
    value: '62',
    label: 'Blocks in the registry',
    delta: '+10',
    deltaDirection: 'up-is-good',
    deltaRose: true,
  },
  {
    value: '1.8s',
    label: 'Median export time',
    delta: '−32%',
    deltaDirection: 'down-is-good',
    deltaRose: false,
  },
  {
    value: '51',
    label: 'Motion presets',
    delta: '+6',
    deltaDirection: 'up-is-good',
    deltaRose: true,
  },
  {
    value: '0',
    label: 'Axe violations',
    delta: '',
    deltaDirection: 'neutral',
    deltaRose: false,
  },
]

export const statGridSchema = z.object({
  items: z
    .array(statItemSchema)
    .min(MIN_STATS)
    .max(MAX_STATS)
    .default([...DEFAULT_ITEMS]),
  columns: z.number().int().min(MIN_COLUMNS).max(MAX_COLUMNS).default(4),
  /**
   * Hairline rules between the cells. On, the grid is one plate divided; off, it is figures on the page.
   * Both are correct and they are different blocks visually, which is why it is a prop rather than a look.
   */
  dividers: z.boolean().default(true),
  size: z.enum(STAT_SIZES).default('lg'),
  align: alignment.default('start'),
  ...dataFrameFields(),
})

export type StatGridProps = z.infer<typeof statGridSchema>
