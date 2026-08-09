import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { heroMotion } from '../hero.motion'

/**
 * The entrance only. Playback is not motion the resolver owns: it is an element's own state, decided
 * in the block against the same `--ms-reduced-motion` variable every duration token multiplies by.
 */
export const heroVideoMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = heroMotion
