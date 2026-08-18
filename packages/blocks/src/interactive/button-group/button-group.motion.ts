import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { interactiveMotion } from '../interactive.motion'

/**
 * Entrance only. A hover preset on the group would animate the whole row — the channel animates the
 * node's wrapper, and the wrapper here is the track — so hovering one segment would lift all of them.
 * The per-item feedback is the surface change in `button-group.styles.ts`, which is CSS on the item.
 */
export const buttonGroupMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> =
  interactiveMotion
