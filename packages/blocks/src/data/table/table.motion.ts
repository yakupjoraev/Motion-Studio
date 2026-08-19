import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { dataEntrance } from '../data.motion'

/**
 * Entrance only, and no stagger reaching the rows: fifty rows arriving one after another reads as a loading
 * state rather than as a section, and the section is the thing that arrived. The same call
 * `comparison-table` made about sixteen.
 */
export const tableMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: dataEntrance({ distance: 14, duration: 440 }),
}
