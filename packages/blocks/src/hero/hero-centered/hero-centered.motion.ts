import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { heroMotion } from '../hero.motion'

/** The shared hero entrance, unchanged: `fade-up` with a child stagger. */
export const heroCenteredMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = heroMotion
