import { createPresetRegistry } from '../model/define-preset'
import type { MotionPreset } from '../model/preset.types'

import { ENTRANCE_PRESETS } from './entrance/index'
import { HOVER_PRESETS } from './hover/index'

export * from './entrance/index'
export * from './hover/index'
export * from './shared'

/**
 * The catalogue, in channel order. ANIMATION_SYSTEM.md § Preset catalogue lists six channels; the four
 * still to come — continuous, scroll, cursor, exit — append here, and nothing else changes.
 */
export const PRESETS: readonly MotionPreset[] = [...ENTRANCE_PRESETS, ...HOVER_PRESETS]

export const presetRegistry = createPresetRegistry(PRESETS)
