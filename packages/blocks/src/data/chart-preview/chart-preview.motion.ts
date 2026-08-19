import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { dataMotion } from '../data.motion'

/**
 * The category's arrival, unchanged. The line is not drawn on: a `stroke-dashoffset` reveal would need the
 * path's measured length, and a measurement inside a transform-scaled artboard is the wrong number — the
 * reasoning ADR-203 sets out for the tab indicator. The ring can animate because its length is arithmetic.
 */
export const chartPreviewMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = dataMotion
