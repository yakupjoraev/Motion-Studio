import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { contentEntrance } from '../content.motion'

/** Opacity only: a code sample is read, and text that slides into place is text read twice. */
export const codeBlockMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: contentEntrance('fade'),
}
