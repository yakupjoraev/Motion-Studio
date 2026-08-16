import { createPresetRegistry } from '../model/define-preset'
import type { MotionPreset } from '../model/preset.types'

import { CONTINUOUS_PRESETS } from './continuous/index'
import { CURSOR_PRESETS } from './cursor/index'
import { ENTRANCE_PRESETS } from './entrance/index'
import { EXIT_PRESETS } from './exit/index'
import { HOVER_PRESETS } from './hover/index'
import { SCROLL_PRESETS } from './scroll/index'

export * from './continuous/index'
export * from './cursor/index'
export * from './entrance/index'
export * from './exit/index'
export * from './hover/index'
export * from './scroll/index'
export * from './shared'

/** ANIMATION_SYSTEM.md § Preset catalogue, all six channels in the order the document lists them. */
export const PRESETS: readonly MotionPreset[] = [
  ...ENTRANCE_PRESETS,
  ...SCROLL_PRESETS,
  ...HOVER_PRESETS,
  ...CURSOR_PRESETS,
  ...CONTINUOUS_PRESETS,
  ...EXIT_PRESETS,
]

export const presetRegistry = createPresetRegistry(PRESETS)
