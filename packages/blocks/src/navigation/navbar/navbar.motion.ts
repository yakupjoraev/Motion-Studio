import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { navMotion } from '../navigation.motion'

/**
 * The shared arrival. The dropdown's own open and close belongs to Radix; a motion channel on this node
 * would animate the whole bar every time a menu opened.
 */
export const navbarMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = navMotion
