import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { interactiveMotion } from '../interactive.motion'

/**
 * Entrance only, and it belongs to the block rather than to the dialog: the dialog's own entrance is Radix's
 * `data-state` and CSS, and a preset on this node would animate the trigger and the frame every time the
 * dialog opened.
 */
export const modalTriggerMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> =
  interactiveMotion
