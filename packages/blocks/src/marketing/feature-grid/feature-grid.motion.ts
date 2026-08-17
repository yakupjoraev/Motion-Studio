import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { marketingMotion } from '../marketing.motion'

/**
 * The shared entrance, unchanged: `fade-up` with a child stagger. No `hover` channel — the channel
 * animates the node's wrapper, which here is the whole grid, so a hover on one cell would raise all
 * six. The cells lift themselves in CSS (`cardStyles`, `interactive`).
 */
export const featureGridMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> =
  marketingMotion
