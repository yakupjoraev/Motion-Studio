import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/** Nothing by default: a container that animated would animate every layout the user builds with it. */
export const containerMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {}
