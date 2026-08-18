import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { controlMotion } from '../interactive.motion'

/**
 * Entrance and hover, which is the pair prompt 40 asks for — and the hover half is a *default*, not a
 * hard-coded animation: the five presets it names are all on the `hover` channel and the inspector lists
 * them, so the user can swap `lift` for `magnetic` or remove it entirely (ADR-204).
 */
export const buttonMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = controlMotion
