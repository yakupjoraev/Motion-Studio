import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { dataMotion } from '../data.motion'

/**
 * The category's arrival, unchanged. No stagger down the rail: a sequence whose steps arrive one after another
 * is a sequence the reader waits through, and the order is already carried by the `<ol>`.
 */
export const timelineMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = dataMotion
