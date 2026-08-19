import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { dataMotion } from '../data.motion'

/**
 * The category's arrival, unchanged. No count-up on the figures: a number that animates is text content
 * changing over time, and the motion model animates transform, opacity, filter and clip-path only — a block
 * that counted would be animating something no preset can express and no user could remove.
 */
export const statGridMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = dataMotion
