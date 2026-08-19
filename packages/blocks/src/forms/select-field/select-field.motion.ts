import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { formsMotion } from '../forms.motion'

/**
 * The category's arrival, unchanged. The list is not animated: Radix mounts it in a portal, and a preset applied
 * to the block's own node would never reach an element outside it.
 */
export const selectFieldMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = formsMotion
