import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { marketingEntrance } from '../marketing.motion'

/** One arrival for the whole panel. The form inside it must be still by the time it is reachable. */
export const ctaSplitMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: marketingEntrance({ distance: 16, duration: 460 }),
}
