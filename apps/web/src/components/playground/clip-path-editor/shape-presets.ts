import { PRESETS, type Preset } from '../presets'

import { shapeKindOf } from './basic-shape'

/**
 * The eight shapes PLAYGROUND.md § Presets lists, read off the panel's own table rather than written
 * out again here: a preset that existed twice would be edited once.
 */
export const SHAPE_PRESETS: readonly Preset[] = PRESETS['clip-path']

/** The subset the handles can edit, which is what the round-trip test runs over. */
export const POLYGON_PRESETS: readonly Preset[] = SHAPE_PRESETS.filter(
  (preset) => shapeKindOf(preset.value) === 'polygon',
)
