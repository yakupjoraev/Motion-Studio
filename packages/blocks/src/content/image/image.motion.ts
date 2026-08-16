import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { contentEntrance } from '../content.motion'

/**
 * `blur-in`, which is the one entrance that reads as a photograph resolving rather than as a box
 * sliding. It is the catalogue's most expensive preset and is marked `gpuHeavy`, so the scheduler's
 * cap of three simultaneous instances applies — beyond it an image renders its end state, which for
 * an image is simply the image. ANIMATION_SYSTEM.md § GPU discipline caps the blur at 12 px.
 */
export const imageMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: contentEntrance('blur-in'),
}
