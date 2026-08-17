import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { marketingEntrance } from '../marketing.motion'

/**
 * A short arrival and no stagger reaching the rows: sixteen rows arriving one after another reads as a
 * loading state rather than as a section, and the section is the thing that arrived.
 */
export const comparisonTableMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: marketingEntrance({ distance: 14, duration: 440 }),
}
