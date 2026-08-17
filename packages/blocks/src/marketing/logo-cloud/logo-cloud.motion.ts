import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { marketingEntrance } from '../marketing.motion'

/**
 * Entrance only, and a short one: a logo row is proof rather than a feature, and a 20 px travel on six
 * marks reads as the row assembling itself. No scroll channel in marquee mode for the reason
 * `testimonial-marquee` gives — the row is already animated by the preset's stylesheet (ADR-186).
 */
export const logoCloudMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: marketingEntrance({ distance: 12, duration: 420 }),
}
