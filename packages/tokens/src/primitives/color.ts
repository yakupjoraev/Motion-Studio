/**
 * `DESIGN_SYSTEM.md` § Colour. Twelve steps per hue in OKLCH, so perceptual lightness is even and
 * dark mode is a lightness inversion rather than a hand-tuned second palette.
 *
 * Every value here is transcribed from that document. The chromatic ramps are *derived* there, by
 * the rule restated above `REFERENCE_CHROMA`, and `color.test.ts` re-derives them independently and
 * asserts the transcription matches — a swapped digit in a chroma is invisible in review and visible
 * in all 62 blocks.
 */

export type RampStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 | 1000

export type ColorRamp = Readonly<Record<RampStep, string>>

export const NEUTRAL = {
  50: 'oklch(98.5% 0.002 265)',
  100: 'oklch(96.5% 0.004 265)',
  200: 'oklch(92.5% 0.006 265)',
  300: 'oklch(86.0% 0.008 265)',
  400: 'oklch(70.0% 0.012 265)',
  500: 'oklch(58.0% 0.014 265)',
  600: 'oklch(46.5% 0.014 265)',
  700: 'oklch(37.0% 0.014 265)',
  800: 'oklch(27.0% 0.012 265)',
  900: 'oklch(19.5% 0.010 265)',
  950: 'oklch(14.0% 0.008 265)',
  1000: 'oklch(9.5% 0.006 265)',
} as const satisfies ColorRamp

export const VIOLET = {
  50: 'oklch(98.5% 0.007 285)',
  100: 'oklch(96.5% 0.016 285)',
  200: 'oklch(92.5% 0.036 285)',
  300: 'oklch(86.0% 0.068 285)',
  400: 'oklch(70.0% 0.156 285)',
  500: 'oklch(58.0% 0.229 285)',
  600: 'oklch(46.5% 0.229 285)',
  700: 'oklch(37.0% 0.207 285)',
  800: 'oklch(27.0% 0.153 285)',
  900: 'oklch(19.5% 0.114 285)',
  950: 'oklch(14.0% 0.089 285)',
  1000: 'oklch(9.5% 0.075 285)',
} as const satisfies ColorRamp

export const BLUE = {
  50: 'oklch(98.5% 0.007 255)',
  100: 'oklch(96.5% 0.016 255)',
  200: 'oklch(92.5% 0.035 255)',
  300: 'oklch(86.0% 0.067 255)',
  400: 'oklch(70.0% 0.152 255)',
  500: 'oklch(58.0% 0.182 255)',
  600: 'oklch(46.5% 0.147 255)',
  700: 'oklch(37.0% 0.118 255)',
  800: 'oklch(27.0% 0.089 255)',
  900: 'oklch(19.5% 0.070 255)',
  950: 'oklch(14.0% 0.065 255)',
  1000: 'oklch(9.5% 0.078 255)',
} as const satisfies ColorRamp

export const CYAN = {
  50: 'oklch(98.5% 0.013 210)',
  100: 'oklch(96.5% 0.027 210)',
  200: 'oklch(92.5% 0.041 210)',
  300: 'oklch(86.0% 0.055 210)',
  400: 'oklch(70.0% 0.082 210)',
  500: 'oklch(58.0% 0.096 210)',
  600: 'oklch(46.5% 0.077 210)',
  700: 'oklch(37.0% 0.062 210)',
  800: 'oklch(27.0% 0.046 210)',
  900: 'oklch(19.5% 0.036 210)',
  950: 'oklch(14.0% 0.030 210)',
  1000: 'oklch(9.5% 0.033 210)',
} as const satisfies ColorRamp

export const EMERALD = {
  50: 'oklch(98.5% 0.018 160)',
  100: 'oklch(96.5% 0.036 160)',
  200: 'oklch(92.5% 0.054 160)',
  300: 'oklch(86.0% 0.071 160)',
  400: 'oklch(70.0% 0.107 160)',
  500: 'oklch(58.0% 0.125 160)',
  600: 'oklch(46.5% 0.101 160)',
  700: 'oklch(37.0% 0.081 160)',
  800: 'oklch(27.0% 0.060 160)',
  900: 'oklch(19.5% 0.047 160)',
  950: 'oklch(14.0% 0.039 160)',
  1000: 'oklch(9.5% 0.041 160)',
} as const satisfies ColorRamp

export const AMBER = {
  50: 'oklch(98.5% 0.012 75)',
  100: 'oklch(96.5% 0.027 75)',
  200: 'oklch(92.5% 0.050 75)',
  300: 'oklch(86.0% 0.067 75)',
  400: 'oklch(70.0% 0.100 75)',
  500: 'oklch(58.0% 0.117 75)',
  600: 'oklch(46.5% 0.094 75)',
  700: 'oklch(37.0% 0.076 75)',
  800: 'oklch(27.0% 0.057 75)',
  900: 'oklch(19.5% 0.045 75)',
  950: 'oklch(14.0% 0.042 75)',
  1000: 'oklch(9.5% 0.050 75)',
} as const satisfies ColorRamp

export const ROSE = {
  50: 'oklch(98.5% 0.007 15)',
  100: 'oklch(96.5% 0.017 15)',
  200: 'oklch(92.5% 0.037 15)',
  300: 'oklch(86.0% 0.073 15)',
  400: 'oklch(70.0% 0.184 15)',
  500: 'oklch(58.0% 0.221 15)',
  600: 'oklch(46.5% 0.178 15)',
  700: 'oklch(37.0% 0.142 15)',
  800: 'oklch(27.0% 0.106 15)',
  900: 'oklch(19.5% 0.081 15)',
  950: 'oklch(14.0% 0.066 15)',
  1000: 'oklch(9.5% 0.063 15)',
} as const satisfies ColorRamp

/**
 * `white` in the semantic table is not a ramp step: light `surface-1` and `surface-3` elevate past
 * `neutral.50`, and `foreground-onAccent` is the only value clearing 4.5 : 1 on both modes' accent.
 * The value is the one prompt 04 shows in its `to-css.ts` example.
 */
export const WHITE = 'oklch(100% 0 0)'

const OPAQUE_OKLCH = /^oklch\([^/)]+\)$/

/**
 * Adds an alpha channel to a ramp step, keeping its lightness, chroma and hue byte-identical — so a
 * reader of the generated sheet can still see which step a translucent token came from.
 *
 * Rejects anything that is not an alpha-free `oklch()` literal rather than splicing blindly: the input
 * is always a ramp value today, and a caller that changes that should hear about it at the first test
 * run rather than in a screenshot.
 */
export function withAlpha(color: string, alpha: number): string {
  if (!OPAQUE_OKLCH.test(color)) {
    throw new Error(`withAlpha expects an alpha-free oklch() literal, received: ${color}`)
  }

  return `${color.slice(0, -1)} / ${alpha})`
}

/** Hue angle per shipped ramp. The ramps are hue-constant; only generated palettes drift. */
export const HUE_ANGLE = {
  neutral: 265,
  violet: 285,
  blue: 255,
  cyan: 210,
  emerald: 160,
  amber: 75,
  rose: 15,
} as const

export const RAMPS = {
  neutral: NEUTRAL,
  violet: VIOLET,
  blue: BLUE,
  cyan: CYAN,
  emerald: EMERALD,
  amber: AMBER,
  rose: ROSE,
} as const satisfies Record<keyof typeof HUE_ANGLE, ColorRamp>

export type ColorHue = keyof typeof RAMPS

/** The lightness of each step, 0–1. Read straight off the `NEUTRAL` ramp. */
export const LIGHTNESS_LADDER = [
  0.985, 0.965, 0.925, 0.86, 0.7, 0.58, 0.465, 0.37, 0.27, 0.195, 0.14, 0.095,
] as const

/** `NEUTRAL`'s own chroma curve, normalised to its peak. Multipliers, not chroma. */
export const CHROMA_CURVE = [
  0.143, 0.286, 0.429, 0.571, 0.857, 1, 1, 1, 0.857, 0.714, 0.571, 0.429,
] as const

/** Hue drift per step, multiplied by the theme's `accentHueShift` (−30..30 degrees). */
export const HUE_SHIFT_CURVE = [1, 0.8, 0.6, 0.4, 0.2, 0, 0, -0.2, -0.4, -0.6, -0.8, -1] as const

/**
 * Peak chroma per hue: 95 % of the sRGB gamut boundary at step 500's lightness. Every non-neutral
 * step follows from it:
 *
 * ```
 * chroma[i] = min( REFERENCE_CHROMA[hue] × CHROMA_CURVE[i],
 *                  0.95 × maxInGamutChroma(LIGHTNESS_LADDER[i], hue) )
 * ```
 *
 * The per-step clamp is not optional — the sRGB gamut collapses at the lightness extremes far faster
 * than the curve tapers, so one global factor that kept every step in gamut would crush the mid
 * steps to grey. It is also the operation `generateRamp` applies at runtime
 * (`THEME_ENGINE.md` § Palette generation), which is why a generated palette has the same character
 * as the shipped ramps.
 */
export const REFERENCE_CHROMA = {
  neutral: 0.014,
  violet: 0.229,
  blue: 0.182,
  cyan: 0.096,
  emerald: 0.125,
  amber: 0.117,
  rose: 0.221,
} as const satisfies Record<ColorHue, number>

/** The 0.95 inset that keeps every step off the gamut boundary, where 8-bit rounding could push it out. */
export const GAMUT_INSET = 0.95

export const RAMP_STEPS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000,
] as const satisfies readonly RampStep[]
