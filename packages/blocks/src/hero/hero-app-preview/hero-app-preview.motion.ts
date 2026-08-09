import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { heroMotion } from '../hero.motion'

/**
 * The entrance only. The tilt is a static prop, and `tilt-3d` on the `hover` channel is deliberately
 * *not* declared here: a plate that leans toward the cursor is a choice, and a hero that does it
 * without being asked is a page that fidgets. `capabilities.supportsMotion` lists `hover`, so the
 * motion panel offers it; this file is what the block does when nobody has chosen anything.
 */
export const heroAppPreviewMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = heroMotion
