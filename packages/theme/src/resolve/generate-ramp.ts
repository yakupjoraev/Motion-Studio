import {
  CHROMA_CURVE,
  type ColorRamp,
  GAMUT_INSET,
  HUE_SHIFT_CURVE,
  LIGHTNESS_LADDER,
  RAMP_STEPS,
  type RampStep,
} from '@motion-studio/tokens'
import { clampChroma, formatOklch, parseOklch } from '@motion-studio/utils'

export interface RampOptions {
  /** 0.5..1.5. Multiplies the whole curve. */
  readonly saturation: number
  /** −30..30 degrees, applied through `HUE_SHIFT_CURVE`. */
  readonly hueShift: number
}

/** Wider than any sRGB chroma, so clamping it returns the gamut boundary itself. */
const BEYOND_GAMUT = 0.5

/**
 * `THEME_ENGINE.md` § Palette generation. Twelve steps from one seed, holding the lightness ladder and
 * the chroma curve from `packages/tokens` and substituting the seed's hue.
 *
 * The three details the document calls the whole value of this function:
 *
 * 1. **`clampChroma` per lightness.** The sRGB gamut collapses at the lightness extremes far faster
 *    than the curve tapers, so a single global factor would crush the mid steps to grey —
 *    `DESIGN_SYSTEM.md` § The three curves measures that alternative and discards it. The `GAMUT_INSET`
 *    is applied here too, which is what makes a generated palette have the same character as the
 *    shipped ramps rather than merely the same shape: seeding this function with `violet.500` returns
 *    `VIOLET` step for step.
 * 2. **`HUE_SHIFT_CURVE` drift.** A positive shift rotates the light end toward a higher hue angle and
 *    the dark end toward a lower one, which is how pigment behaves. Hue-constant ramps look synthetic.
 * 3. **The seed's own lightness is ignored for the ramp** and used only to pick which step becomes
 *    `accent` — `accentStepFor`. A user picking a pale colour gets step 400 as their accent, not 600.
 *
 * What the seed's chroma carries into the ramp is its **relative** saturation — how chromatic it is for
 * its own lightness — not its absolute chroma. `seedSaturation` below is that ratio. Absolute chroma
 * cannot be the measure: the gamut ceiling at 70 % lightness is 0.164 and at 58 % it is 0.241, so
 * `violet.400` and `violet.500` are both as saturated as their lightness allows while differing by 0.07
 * in chroma. Reading absolutely, a seed picked from the light end of a ramp would generate a duller
 * ramp than the same colour picked from the middle. See ADR-023.
 */
export function generateRamp(seed: string, options: RampOptions): ColorRamp {
  const { l, c, h } = parseOklch(seed)
  // The hue is unshifted at the curve's peak — `HUE_SHIFT_CURVE` is 0 there — so the reference chroma
  // is measured on the seed's own hue. This is `REFERENCE_CHROMA[hue]` generalised to any hue.
  const reference = gamutCeiling(PEAK_LIGHTNESS, h)
  const peak = seedSaturation(l, c, h) * options.saturation * reference

  const entries = RAMP_STEPS.map((step, index) => {
    const lightness = LIGHTNESS_LADDER[index] ?? 0
    const curve = CHROMA_CURVE[index] ?? 0
    const drift = HUE_SHIFT_CURVE[index] ?? 0
    const hue = normaliseHue(h + options.hueShift * drift)
    const chroma = Math.min(peak * curve, gamutCeiling(lightness, hue))

    return [step, formatOklch(lightness, chroma, hue)] as const
  })

  return Object.fromEntries(entries) as ColorRamp
}

/** The lightness the chroma curve peaks at — step 500, `DESIGN_SYSTEM.md` § The three curves. */
const PEAK_LIGHTNESS = LIGHTNESS_LADDER[RAMP_STEPS.indexOf(500)] ?? 0.58

/** The widest chroma in gamut at that lightness and hue, inset off the boundary. */
function gamutCeiling(lightness: number, hue: number): number {
  return GAMUT_INSET * clampChroma(BEYOND_GAMUT, lightness, hue)
}

/**
 * How chromatic the seed is for its own lightness, 0–1. A seed sitting on the gamut boundary returns 1
 * and generates a ramp that rides the boundary at every step, which is what the shipped ramps do.
 */
export function seedSaturation(lightness: number, chroma: number, hue: number): number {
  const ceiling = gamutCeiling(lightness, hue)

  return ceiling === 0 ? 0 : Math.min(chroma / ceiling, 1)
}

/** Keeps a shifted hue inside 0–360, so a seed near the wrap point behaves like any other. */
export function normaliseHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

/**
 * Which step the seed itself becomes: the one whose ladder lightness is nearest the seed's, so a pale
 * seed lands high on the ramp and a deep one lands low — detail 3 of § Palette generation.
 */
export function accentStepFor(seed: string): RampStep {
  const { l } = parseOklch(seed)
  let best: RampStep = 500
  let bestDistance = Number.POSITIVE_INFINITY

  RAMP_STEPS.forEach((step, index) => {
    const distance = Math.abs((LIGHTNESS_LADDER[index] ?? 0) - l)
    if (distance < bestDistance) {
      bestDistance = distance
      best = step
    }
  })

  return best
}
