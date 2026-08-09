import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/** A paragraph arrives with the band it sits in; the entrance belongs to the section, not the line. */
export const textMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {}
