import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/**
 * No default. Playback is not motion the resolver owns — it is an element's own state, decided against
 * the same `--ms-reduced-motion` variable every duration token multiplies by.
 */
export const videoMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {}
