import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/** None by default; a stagger over the children belongs to the block that fills the grid. */
export const gridMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {}
