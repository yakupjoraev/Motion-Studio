import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/**
 * No default entrance. An image that fades in is an image whose paint the user waits for twice, and
 * PERFORMANCE.md § Images is explicit that an above-the-fold image should appear as soon as it decodes.
 */
export const imageMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {}
