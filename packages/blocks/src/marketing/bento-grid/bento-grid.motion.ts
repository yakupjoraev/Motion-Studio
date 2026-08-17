import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { marketingMotion } from '../marketing.motion'

/**
 * The shared entrance. The stagger reaches the cells because they are the node's children, which is
 * what makes a bento composition assemble rather than appear — and the reason no hover channel is
 * declared: the channel would animate the whole grid.
 */
export const bentoGridMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = marketingMotion
