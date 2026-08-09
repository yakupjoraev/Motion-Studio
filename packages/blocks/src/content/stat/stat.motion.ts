import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/**
 * No default. `counter` exists in ANIMATION_SYSTEM.md § Entrance and is the obvious preset here, but
 * the value is a *string* — `1.8s`, `−32%`, `3×` — and a count-up that has to parse a format back out
 * of it would be guessing. A user who wants it picks it in the motion panel, where the format is theirs.
 */
export const statMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {}
