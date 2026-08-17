import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { marketingEntrance } from '../marketing.motion'

/**
 * A short entrance and nothing else. A form is a thing a reader is about to type in, and a field that is
 * still settling when the pointer arrives is a field that gets missed.
 */
export const newsletterFormMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: marketingEntrance({ distance: 12, duration: 400 }),
}
