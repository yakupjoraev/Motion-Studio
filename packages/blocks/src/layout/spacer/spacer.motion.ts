import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/** Nothing: animating a gap animates the layout around it, which § Rules 9 bans. */
export const spacerMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {}
