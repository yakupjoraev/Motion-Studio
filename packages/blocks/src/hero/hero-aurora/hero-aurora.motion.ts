import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { heroMotion } from '../hero.motion'

/**
 * The entrance only. The drift is *not* declared here on purpose: ANIMATION_SYSTEM.md § Rules 7 wants
 * animation to come from a preset, and the `aurora` continuous preset exists — but this block has to
 * export as plain CSS with no runtime, which a preset resolved by `packages/motion` cannot do. The
 * drift is therefore a property of the backdrop, switched by a prop, and stopped by the same
 * reduced-motion mechanism every duration token carries.
 */
export const heroAuroraMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = heroMotion
