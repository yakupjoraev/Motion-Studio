import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { formsEntrance } from '../forms.motion'

/**
 * A slightly longer arrival than a single field's, because the form is a block of its own rather than one row in
 * one. No stagger down the fields: a form whose inputs arrive one after another is a form the reader waits for.
 */
export const contactFormMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: formsEntrance({ distance: 14, duration: 440 }),
}
