import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { contentEntrance } from '../content.motion'

/**
 * `scale-in` on a spring: a badge is small enough that a 24 px translation would carry it further
 * than its own height, which reads as a different element arriving rather than this one.
 */
export const badgeMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: contentEntrance('scale-in'),
}
