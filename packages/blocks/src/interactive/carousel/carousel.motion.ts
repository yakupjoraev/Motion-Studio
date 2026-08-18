import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { interactiveEntrance } from '../interactive.motion'

/**
 * Entrance only, and a shorter one than the category default: a strip that slides in and can then be scrolled
 * has two movements competing for the same axis. 8 px, so it settles rather than travels.
 *
 * The slide change is the scroller's own `scroll-behavior: smooth`, which the browser owns and reduced motion
 * switches off without us asking — one of the reasons the block is a native scroller at all.
 */
export const carouselMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: interactiveEntrance({ distance: 8 }),
}
