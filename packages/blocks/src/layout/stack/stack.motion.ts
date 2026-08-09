import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/** None: a stack animating would animate every layout a user builds inside it. */
export const stackMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {}
