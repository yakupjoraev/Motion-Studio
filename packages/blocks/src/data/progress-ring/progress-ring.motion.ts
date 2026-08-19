import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { dataMotion } from '../data.motion'

/**
 * The category's arrival, unchanged. The **fill** is not a preset and deliberately not one: it is
 * `stroke-dashoffset`, which no channel in the motion model animates, and a user who removed the entrance
 * should still see the ring draw itself.
 */
export const progressRingMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = dataMotion
