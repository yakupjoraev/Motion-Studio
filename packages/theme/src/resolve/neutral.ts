import type { NeutralHue } from '../theme.types'

/**
 * The six neutral families of `THEME_ENGINE.md` § ThemeConfig, as hue angle and chroma multiplier —
 * ADR-022. `slate` is the shipped `NEUTRAL` ramp unchanged, so the default preset generates exactly
 * what `packages/tokens` already contrast-verified.
 *
 * The warm and cool pairs mirror each other in strength, so the control reads as one temperature axis
 * with a neutral centre. `gray` is achromatic and therefore cannot express a hue shift — there is no
 * chroma to shift, which is the point of offering it.
 */
export interface NeutralFamily {
  readonly hue: number
  readonly chroma: number
}

export const NEUTRAL_FAMILY = {
  cool: { hue: 230, chroma: 1.15 },
  slate: { hue: 265, chroma: 1 },
  zinc: { hue: 285, chroma: 0.7 },
  gray: { hue: 0, chroma: 0 },
  stone: { hue: 75, chroma: 0.7 },
  warm: { hue: 45, chroma: 1.15 },
} as const satisfies Record<NeutralHue, NeutralFamily>

export const NEUTRAL_HUES = Object.keys(NEUTRAL_FAMILY) as readonly NeutralHue[]
