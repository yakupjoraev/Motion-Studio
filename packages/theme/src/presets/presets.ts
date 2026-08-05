import { GAMUT_INSET } from '@motion-studio/tokens'
import { clampChroma, formatOklch } from '@motion-studio/utils'

import type { ThemeConfig } from '../theme.types'

/**
 * `THEME_ENGINE.md` § Presets. The document gives each preset a name and a one-line character; the field
 * values are derived from that line under the criteria in ADR-027, and every preset is contrast-tested in
 * CI by `presets.test.ts`.
 *
 * Accent seeds are written as `oklch()` at the lightness that selects the intended accent step and at the
 * chroma that is fully saturated for it, so a preset's ramp rides the gamut the way the shipped ramps do —
 * ADR-023. `seedAt` states that intent once rather than leaving twelve magic strings.
 */

/** Lightness of the ramp step this seed should select — `LIGHTNESS_LADDER` positions. */
const STEP_LIGHTNESS = { 300: 0.86, 400: 0.7, 500: 0.58, 600: 0.465, 700: 0.37 } as const

/** Hues the presets draw on, named so a row reads as a colour rather than as a number. */
const HUE = { violet: 285, cyan: 210, blue: 255, amber: 75, rose: 15, emerald: 160 } as const

/**
 * A seed at the given step's lightness, fully saturated for it — the gamut ceiling, inset the same 0.95
 * the shipped ramps use. Riding the ceiling is what makes a preset's ramp reproduce a shipped one; a
 * preset that wants a duller palette turns `palette.saturation` down rather than dimming its seed, so
 * there is one knob for it instead of two.
 */
const seedAt = (step: keyof typeof STEP_LIGHTNESS, hue: number): string => {
  const lightness = STEP_LIGHTNESS[step]

  return formatOklch(lightness, GAMUT_INSET * clampChroma(0.5, lightness, hue), hue)
}

const STUDIO_TYPOGRAPHY = { pairing: 'geist', baseSize: 14, scaleRatio: 1.2 } as const

export const studioDark: ThemeConfig = {
  id: 'studio-dark',
  name: 'Studio Dark',
  colorMode: 'dark',
  palette: { accent: seedAt(400, HUE.violet), neutral: 'slate', accentHueShift: 0, saturation: 1 },
  radiusScale: 1,
  spacingScale: 1,
  motionScale: 1,
  elevationStyle: 'soft',
  typography: STUDIO_TYPOGRAPHY,
  surface: { glassLevel: 'subtle', noiseLevel: 'none', borderStyle: 'hairline' },
}

export const studioLight: ThemeConfig = {
  ...studioDark,
  id: 'studio-light',
  name: 'Studio Light',
  colorMode: 'light',
  palette: { ...studioDark.palette, accent: seedAt(600, HUE.violet) },
}

/** "Deep blue-black, cyan accent, glow elevation." */
export const midnight: ThemeConfig = {
  id: 'midnight',
  name: 'Midnight',
  colorMode: 'dark',
  palette: { accent: seedAt(400, HUE.cyan), neutral: 'cool', accentHueShift: -8, saturation: 1.15 },
  radiusScale: 1,
  spacingScale: 1,
  motionScale: 1,
  elevationStyle: 'glow',
  typography: STUDIO_TYPOGRAPHY,
  surface: { glassLevel: 'medium', noiseLevel: 'subtle', borderStyle: 'hairline' },
}

/** "Warm neutrals, sharp elevation, no glass. Editorial." */
export const paper: ThemeConfig = {
  id: 'paper',
  name: 'Paper',
  colorMode: 'light',
  palette: { accent: seedAt(700, HUE.amber), neutral: 'stone', accentHueShift: 6, saturation: 0.9 },
  radiusScale: 0.5,
  spacingScale: 1.125,
  motionScale: 1,
  elevationStyle: 'sharp',
  typography: { pairing: 'sohne-berkeley', baseSize: 16, scaleRatio: 1.25 },
  surface: { glassLevel: 'none', noiseLevel: 'subtle', borderStyle: 'hairline' },
}

/** "Zero radius, sharp shadows, high contrast, mono display." */
export const brutal: ThemeConfig = {
  id: 'brutal',
  name: 'Brutal',
  colorMode: 'light',
  palette: { accent: seedAt(700, HUE.rose), neutral: 'gray', accentHueShift: 0, saturation: 1.5 },
  radiusScale: 0,
  spacingScale: 1,
  motionScale: 0.5,
  elevationStyle: 'sharp',
  typography: { pairing: 'inter-mono', baseSize: 14, scaleRatio: 1.333 },
  surface: { glassLevel: 'none', noiseLevel: 'none', borderStyle: 'solid' },
}

/** "Violet→cyan, strong glass, medium noise." */
export const aurora: ThemeConfig = {
  id: 'aurora',
  name: 'Aurora',
  colorMode: 'dark',
  palette: {
    accent: seedAt(400, HUE.violet),
    neutral: 'zinc',
    accentHueShift: 24,
    saturation: 1.2,
  },
  radiusScale: 1.5,
  spacingScale: 1,
  motionScale: 1,
  elevationStyle: 'glow',
  typography: { pairing: 'satoshi-jet', baseSize: 14, scaleRatio: 1.25 },
  surface: { glassLevel: 'strong', noiseLevel: 'medium', borderStyle: 'hairline' },
}

/** "Warm stone neutrals, amber accent." */
export const ember: ThemeConfig = {
  id: 'ember',
  name: 'Ember',
  colorMode: 'dark',
  palette: { accent: seedAt(400, HUE.amber), neutral: 'warm', accentHueShift: -6, saturation: 1.1 },
  radiusScale: 1,
  spacingScale: 1,
  motionScale: 1,
  elevationStyle: 'soft',
  typography: STUDIO_TYPOGRAPHY,
  surface: { glassLevel: 'subtle', noiseLevel: 'light', borderStyle: 'hairline' },
}

/** "Cool desaturated, blue accent, flat elevation." */
export const nord: ThemeConfig = {
  id: 'nord',
  name: 'Nord',
  colorMode: 'dark',
  palette: { accent: seedAt(400, HUE.blue), neutral: 'cool', accentHueShift: 0, saturation: 0.75 },
  radiusScale: 0.5,
  spacingScale: 1,
  motionScale: 1,
  elevationStyle: 'flat',
  typography: STUDIO_TYPOGRAPHY,
  surface: { glassLevel: 'none', noiseLevel: 'none', borderStyle: 'hairline' },
}

/** "Pure neutral, no accent hue, radius 0.5." */
export const mono: ThemeConfig = {
  id: 'mono',
  name: 'Mono',
  colorMode: 'light',
  // No accent hue: the seed is achromatic, so the accent ramp is the neutral ramp and the accent reads as
  // ink rather than as a colour. `saturation` has nothing to act on, which is the point.
  palette: { accent: formatOklch(0.465, 0, 0), neutral: 'gray', accentHueShift: 0, saturation: 1 },
  radiusScale: 0.5,
  spacingScale: 1,
  motionScale: 1,
  elevationStyle: 'soft',
  typography: STUDIO_TYPOGRAPHY,
  surface: { glassLevel: 'none', noiseLevel: 'none', borderStyle: 'hairline' },
}

/** "High chroma, large radius, soft elevation." */
export const candy: ThemeConfig = {
  id: 'candy',
  name: 'Candy',
  colorMode: 'light',
  palette: { accent: seedAt(600, HUE.rose), neutral: 'zinc', accentHueShift: 18, saturation: 1.5 },
  radiusScale: 2,
  spacingScale: 1.125,
  motionScale: 1.5,
  elevationStyle: 'soft',
  typography: { pairing: 'satoshi-jet', baseSize: 15, scaleRatio: 1.25 },
  surface: { glassLevel: 'subtle', noiseLevel: 'none', borderStyle: 'hairline' },
}

/** The ten presets, in the order `THEME_ENGINE.md` § Presets lists them. */
export const PRESETS = {
  'studio-dark': studioDark,
  'studio-light': studioLight,
  midnight,
  paper,
  brutal,
  aurora,
  ember,
  nord,
  mono,
  candy,
} as const satisfies Record<string, ThemeConfig>

export type PresetId = keyof typeof PRESETS
