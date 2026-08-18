import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { interactiveMotion } from '../interactive.motion'

/**
 * Entrance only. The mode change itself is already animated, and not by this block: `THEME_ENGINE.md` § Colour
 * mode gives the root a 180 ms colour transition gated by `data-theme-ready`, so the whole page crossfades and a
 * preset here would move the switch while the page changed colour underneath it.
 */
export const themeToggleMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> =
  interactiveMotion
