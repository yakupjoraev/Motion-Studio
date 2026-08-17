import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { marketingEntrance } from '../marketing.motion'

/**
 * A single `fade-up` with the stagger reaching the eyebrow, headline, sentence and buttons — the band is
 * one statement, so it arrives as one. No hover: a band the width of the page lifting under the pointer
 * would move the whole section.
 */
export const ctaBannerMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: marketingEntrance({ distance: 18 }),
}
