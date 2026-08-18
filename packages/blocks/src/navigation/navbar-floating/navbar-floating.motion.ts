import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { navEntrance } from '../navigation.motion'

/**
 * The pill travels a little further than the bar does — 16 px rather than 12 — because it is detached and
 * has a shadow, so the arrival reads as a thing landing rather than as a row appearing.
 */
export const navbarFloatingMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: navEntrance({ distance: 16, duration: 460 }),
}
