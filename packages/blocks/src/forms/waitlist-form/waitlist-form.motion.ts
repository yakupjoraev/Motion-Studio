import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { formsMotion } from '../forms.motion'

/** The category's arrival, unchanged. One row is not a section — `forms.motion.ts` says why nothing else moves. */
export const waitlistFormMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = formsMotion
