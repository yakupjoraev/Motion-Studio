import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { formsMotion } from '../forms.motion'

/** The category's arrival, unchanged. Nothing in a field animates on its own — `forms.motion.ts` says why. */
export const inputFieldMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = formsMotion
