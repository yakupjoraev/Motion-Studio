import {
  AMBER,
  BLUE,
  CYAN,
  type ColorMode,
  type ColorRamp,
  EMERALD,
  REFERENCE_CHROMA,
  ROSE,
  type RampStep,
  type SemanticColorToken,
  type SemanticColors,
  WHITE,
  withAlpha,
} from '@motion-studio/tokens'
import { formatOklch } from '@motion-studio/utils'

import { accentStepFor, generateRamp } from './generate-ramp'
import { NEUTRAL_FAMILY } from './neutral'
import {
  type ColorSource,
  type ColorSpec,
  LADDER_DIRECTION,
  SEMANTIC_MAP,
  stepAt,
} from './semantic-map'

import type { ThemePalette } from '../theme.types'

/**
 * The ramps a mode's semantic map draws from. Accent and neutral are generated from the config; the
 * status hues and the two canvas feedback hues stay as shipped, because a theme changes the palette's
 * identity, not what "danger" means — `DESIGN_SYSTEM.md` § Semantic tokens keeps them on fixed hues so
 * selection, guide and snap remain three distinguishable hues under every theme.
 */
export interface PaletteRamps {
  readonly accent: ColorRamp
  readonly neutral: ColorRamp
  readonly accentStep: RampStep
}

/** Step 500's lightness: where the chroma curve peaks, and so where a neutral family is specified. */
const NEUTRAL_SEED_LIGHTNESS = 0.58

export function buildRamps(palette: ThemePalette): PaletteRamps {
  const family = NEUTRAL_FAMILY[palette.neutral]
  const neutralSeed = formatOklch(
    NEUTRAL_SEED_LIGHTNESS,
    REFERENCE_CHROMA.neutral * family.chroma,
    family.hue,
  )

  return {
    accent: generateRamp(palette.accent, {
      saturation: palette.saturation,
      hueShift: palette.accentHueShift,
    }),
    // `saturation` is documented as the palette's chroma multiplier with no scope, so it applies here
    // too. `presets.test.ts` sweeps the full 0.5–1.5 range against both contrast lists, because every
    // surface in them is built from this ramp.
    neutral: generateRamp(neutralSeed, {
      saturation: palette.saturation,
      hueShift: palette.accentHueShift,
    }),
    accentStep: accentStepFor(palette.accent),
  }
}

const FIXED_RAMPS: Readonly<
  Record<Exclude<ColorSource, 'neutral' | 'accent' | 'white'>, ColorRamp>
> = {
  success: EMERALD,
  warning: AMBER,
  danger: ROSE,
  info: BLUE,
  guide: CYAN,
  snap: ROSE,
}

/** Resolves one semantic token against the ramps. Exported so contrast repair can re-resolve a step. */
export function resolveToken(
  token: SemanticColorToken,
  mode: ColorMode,
  ramps: PaletteRamps,
  accentOverride?: RampStep,
): string {
  const spec = SEMANTIC_MAP[mode][token]

  if (spec.source === 'white') {
    return WHITE
  }

  const ramp: ColorRamp =
    spec.source === 'accent'
      ? ramps.accent
      : spec.source === 'neutral'
        ? ramps.neutral
        : FIXED_RAMPS[spec.source]

  const step = resolveStep(spec, mode, ramps, accentOverride)
  const value = ramp[step]

  return spec.alpha === undefined ? value : withAlpha(value, spec.alpha)
}

/**
 * An accent offset is relative to the step the seed selected and points away from the mode's surfaces; a
 * fixed step is taken as written. `500` is unreachable in practice — every spec carries one or the other —
 * and is there so the function is total without a cast.
 */
function resolveStep(
  spec: ColorSpec,
  mode: ColorMode,
  ramps: PaletteRamps,
  accentOverride?: RampStep,
): RampStep {
  if (spec.source !== 'accent' || spec.offset === undefined) {
    return spec.step ?? 500
  }

  return stepAt(accentOverride ?? ramps.accentStep, spec.offset * LADDER_DIRECTION[mode])
}

export function buildSemanticColors(
  mode: ColorMode,
  ramps: PaletteRamps,
  accentOverride?: RampStep,
): SemanticColors {
  const tokens = Object.keys(SEMANTIC_MAP[mode]) as SemanticColorToken[]
  const entries = tokens.map((token) => [token, resolveToken(token, mode, ramps, accentOverride)])

  return Object.fromEntries(entries) as SemanticColors
}
