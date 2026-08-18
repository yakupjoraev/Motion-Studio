import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { interactiveMotion } from '../interactive.motion'

/**
 * Entrance only. The panel change is not a motion channel: it is the indicator's own transition, which is CSS
 * on an element rather than a preset on the node — a preset would animate the whole block every time a tab
 * changed, which is a block that re-enters rather than a panel that swaps.
 */
export const tabsMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = interactiveMotion
