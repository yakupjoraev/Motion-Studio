import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { interactiveMotion } from '../interactive.motion'

/**
 * Entrance only. The bubble's own appearance is a token-timed opacity and scale in CSS, so it collapses under
 * reduced motion and the bubble simply appears — which is the composition the block is designed to be readable
 * in. A hover preset on this node would move the control the tooltip is describing.
 */
export const tooltipTargetMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> =
  interactiveMotion
