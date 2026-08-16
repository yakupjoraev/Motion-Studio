import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { contentEntrance } from '../content.motion'

/** The same 16 px lift the heading takes, so a heading and its paragraph arrive as one movement. */
export const textMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: contentEntrance('fade-up', { distance: 16 }),
}
