import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { contentEntrance } from '../content.motion'

/** A quotation interrupts the band it sits in, and arrives with the preset's own 24 px lift. */
export const quoteMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: contentEntrance('fade-up'),
}
