import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { marketingEntrance } from '../marketing.motion'

/**
 * The shared entrance, with the stagger doing more work than usual: rows are tall, so they arrive one
 * at a time as the reader reaches them rather than all at once. No hover channel — a row is not a card.
 */
export const featureSplitMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: marketingEntrance({ distance: 24 }),
}
