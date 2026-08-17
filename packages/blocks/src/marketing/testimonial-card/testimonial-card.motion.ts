import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { marketingCardMotion } from '../marketing.motion'

/**
 * Entrance **and** hover, which is the pair prompt 38 names for cards — and this is a block that genuinely
 * is one card, so the hover channel lands on the element the pointer is actually over. The grid blocks
 * cannot use it: their node is the grid.
 */
export const testimonialCardMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> =
  marketingCardMotion
