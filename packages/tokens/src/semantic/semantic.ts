import { DARK } from './dark'
import { LIGHT } from './light'

import type { ColorMode, SemanticColors } from './semantic.types'

/**
 * The two mode maps as one record, so a consumer that iterates modes — the contrast gate, the CSS
 * generator, the theme engine's base for a generated palette — writes the loop once.
 */
export const SEMANTIC = {
  light: LIGHT,
  dark: DARK,
} as const satisfies Record<ColorMode, SemanticColors>

export const COLOR_MODES = ['light', 'dark'] as const satisfies readonly ColorMode[]
