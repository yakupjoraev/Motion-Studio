import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { contentEntrance } from '../content.motion'

/**
 * A short lift, 16 px rather than the section's 24: a heading that travels as far as the band it
 * sits in reads as a second arrival instead of part of the first.
 */
export const headingMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: contentEntrance('fade-up', { distance: 16 }),
}
