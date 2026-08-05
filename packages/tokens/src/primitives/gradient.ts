import { AMBER, BLUE, CYAN, EMERALD, NEUTRAL, ROSE, VIOLET } from './color'

/**
 * `DESIGN_SYSTEM.md` § Gradients. Four kinds, all data-driven so the inspector and codegen share one
 * representation. Mesh gradients render as stacked `radial-gradient`s plus a blur — no WebGL, no
 * canvas, and they export as plain CSS.
 */

/** Percentages of the box, as § Gradients states for mesh positions. */
export interface Position {
  readonly x: number
  readonly y: number
}

/** `position` is 0–100. */
export interface ColorStop {
  readonly color: string
  readonly position: number
}

export interface MeshPoint {
  readonly color: string
  readonly x: number
  readonly y: number
  readonly radius: number
}

export type Gradient =
  | { readonly kind: 'linear'; readonly angle: number; readonly stops: readonly ColorStop[] }
  | {
      readonly kind: 'radial'
      readonly shape: 'circle' | 'ellipse'
      readonly at: Position
      readonly stops: readonly ColorStop[]
    }
  | {
      readonly kind: 'conic'
      readonly from: number
      readonly at: Position
      readonly stops: readonly ColorStop[]
    }
  | { readonly kind: 'mesh'; readonly points: readonly MeshPoint[]; readonly blur: number }

/**
 * `readable` is the contract each preset declares about text placed directly on it:
 *
 * - a `foreground` value — it clears 4.5 : 1 against *every* stop, and `gradient.test.ts` asserts the
 *   declared value, so a preset cannot claim readability it does not have
 * - `null` — a display gradient. It spans too much of the lightness ladder for any single foreground
 *   to work, and a block that puts text over it must add a scrim first.
 */
export interface GradientPreset {
  readonly gradient: Gradient
  readonly readable: string | null
}

const linear = (angle: number, stops: readonly ColorStop[]): Gradient => ({
  kind: 'linear',
  angle,
  stops,
})

/**
 * Ten presets. Every stop is a ramp reference, so a gradient inherits the palette rather than pinning
 * its own colours.
 *
 * Two of the ten are mesh or conic rather than linear because their character depends on it: `aurora`
 * is an interference pattern between overlapping fields, and `cyber` needs a hue to return to where
 * it started, which only a conic sweep does. The other eight are linear — the one form that exports
 * to CSS with no fallback and costs nothing to composite.
 *
 * Four of them are `readable: null`. Measured against every ramp step, a gradient running from step
 * 400 to step 700 has no foreground clearing 4.5 : 1 at both ends. Those four are the vivid ones, and
 * pulling their stops into one half of the ladder to win the test would have made them ordinary, so
 * they keep their range and lose the right to carry text directly.
 */
export const GRADIENT = {
  aurora: {
    gradient: {
      kind: 'mesh',
      blur: 80,
      points: [
        { color: VIOLET[500], x: 20, y: 25, radius: 55 },
        { color: CYAN[400], x: 75, y: 20, radius: 50 },
        { color: EMERALD[400], x: 60, y: 80, radius: 45 },
        { color: NEUTRAL[1000], x: 10, y: 90, radius: 60 },
      ],
    },
    readable: null,
  },
  sunset: {
    gradient: linear(135, [
      { color: AMBER[400], position: 0 },
      { color: ROSE[500], position: 55 },
      { color: VIOLET[600], position: 100 },
    ]),
    readable: null,
  },
  ember: {
    gradient: linear(120, [
      { color: ROSE[700], position: 0 },
      { color: ROSE[500], position: 40 },
      { color: AMBER[400], position: 100 },
    ]),
    readable: null,
  },
  cyber: {
    // `at` is the CSS default for `conic-gradient`, which is what the preset table's "conic from 220°"
    // leaves unstated — the sweep centre is the only position a full hue return can start from.
    gradient: {
      kind: 'conic',
      from: 220,
      at: { x: 50, y: 50 },
      stops: [
        { color: VIOLET[500], position: 0 },
        { color: CYAN[400], position: 35 },
        { color: VIOLET[500], position: 70 },
        { color: ROSE[500], position: 100 },
      ],
    },
    readable: null,
  },
  ocean: {
    gradient: linear(160, [
      { color: BLUE[800], position: 0 },
      { color: BLUE[700], position: 45 },
      { color: CYAN[600], position: 100 },
    ]),
    readable: NEUTRAL[50],
  },
  'violet-haze': {
    gradient: linear(180, [
      { color: VIOLET[900], position: 0 },
      { color: VIOLET[800], position: 60 },
      { color: VIOLET[700], position: 100 },
    ]),
    readable: NEUTRAL[50],
  },
  midnight: {
    gradient: linear(200, [
      { color: NEUTRAL[1000], position: 0 },
      { color: BLUE[900], position: 55 },
      { color: VIOLET[800], position: 100 },
    ]),
    readable: NEUTRAL[50],
  },
  nordic: {
    gradient: linear(170, [
      { color: BLUE[800], position: 0 },
      { color: NEUTRAL[700], position: 50 },
      { color: CYAN[700], position: 100 },
    ]),
    readable: NEUTRAL[50],
  },
  mint: {
    gradient: linear(145, [
      { color: EMERALD[200], position: 0 },
      { color: EMERALD[300], position: 50 },
      { color: CYAN[200], position: 100 },
    ]),
    readable: NEUTRAL[950],
  },
  peach: {
    gradient: linear(130, [
      { color: AMBER[200], position: 0 },
      { color: ROSE[300], position: 55 },
      { color: ROSE[200], position: 100 },
    ]),
    readable: NEUTRAL[950],
  },
} as const satisfies Record<string, GradientPreset>

/**
 * The scrim a display preset needs before it can carry text. § Gradients: "`oklch(0% 0 0 / 0.45)`
 * over a dark-text region or `oklch(100% 0 0 / 0.55)` over a light-text one, and the block that adds
 * it verifies the composite." That verification belongs to the block, because it depends on where the
 * text sits.
 */
export const GRADIENT_SCRIM = {
  dark: 'oklch(0% 0 0 / 0.45)',
  light: 'oklch(100% 0 0 / 0.55)',
} as const

export type GradientToken = keyof typeof GRADIENT
export type GradientScrimToken = keyof typeof GRADIENT_SCRIM
