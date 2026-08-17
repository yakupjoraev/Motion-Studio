import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { marketingEntrance } from '../marketing.motion'

/**
 * Entrance only, and **no scroll channel** — the rows are already animated by the `marquee` preset's own
 * stylesheet (ADR-186), and offering the channel would let a user apply a second scroll animation to the
 * node holding an animation the panel cannot see. The row's speed is the block's `duration` prop instead.
 */
export const testimonialMarqueeMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: marketingEntrance({ distance: 16 }),
}
