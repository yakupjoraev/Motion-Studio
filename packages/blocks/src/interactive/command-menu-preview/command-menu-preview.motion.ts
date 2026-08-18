import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { interactiveEntrance } from '../interactive.motion'

/**
 * A slightly longer travel than the category default, because this one is a *picture of a panel* rather than a
 * control: 16 px is the distance a floating panel settles from, and it is the only movement the block has —
 * there is no hover state on something nobody can press.
 */
export const commandMenuPreviewMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: interactiveEntrance({ distance: 16, duration: 480 }),
}
