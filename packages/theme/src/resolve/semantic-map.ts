import {
  type ColorMode,
  RAMP_STEPS,
  type RampStep,
  type SemanticColorToken,
} from '@motion-studio/tokens'

/**
 * `DESIGN_SYSTEM.md` § Semantic tokens as *steps* rather than as resolved strings, which is what a
 * generated palette needs: the shipped `LIGHT` and `DARK` maps are the same table already applied to
 * the shipped ramps.
 *
 * The duplication is guarded rather than tolerated — `semantic-map.test.ts` applies this table to the
 * shipped ramps and asserts it reproduces `LIGHT` and `DARK` exactly. A drift between the two shows up
 * as a failing test rather than as a palette that is subtly wrong only under a custom theme.
 */

/** Which ramp a token draws from. `white` is not a ramp step — see `DESIGN_SYSTEM.md`'s table. */
export type ColorSource =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'guide'
  | 'snap'
  | 'white'

export interface ColorSpec {
  readonly source: ColorSource
  /**
   * A ramp step, or — for the accent family — an offset from the step the seed selected. The offset is
   * in ladder positions and points away from the mode's surfaces, so `accent-hover` is one step further
   * from the background in both modes (ADR-019).
   */
  readonly step?: RampStep
  readonly offset?: number
  /** Baked in rather than applied at call sites, per `UI_GUIDELINES.md` § Canvas. */
  readonly alpha?: number
}

type SemanticMap = Readonly<Record<SemanticColorToken, ColorSpec>>

const LIGHT_MAP: SemanticMap = {
  'surface-0': { source: 'neutral', step: 50 },
  'surface-1': { source: 'white' },
  'surface-2': { source: 'neutral', step: 100 },
  'surface-3': { source: 'white' },
  'surface-inset': { source: 'neutral', step: 200 },

  foreground: { source: 'neutral', step: 950 },
  'foreground-muted': { source: 'neutral', step: 600 },
  'foreground-subtle': { source: 'neutral', step: 600 },
  'foreground-onAccent': { source: 'white' },

  border: { source: 'neutral', step: 200 },
  'border-strong': { source: 'neutral', step: 300 },
  'border-subtle': { source: 'neutral', step: 100 },

  accent: { source: 'accent', offset: 0 },
  'accent-hover': { source: 'accent', offset: 1 },
  'accent-active': { source: 'accent', offset: 2 },
  'accent-muted': { source: 'accent', step: 100 },
  'accent-ring': { source: 'accent', offset: 0 },

  success: { source: 'success', step: 600 },
  'success-muted': { source: 'success', step: 100 },
  warning: { source: 'warning', step: 600 },
  'warning-muted': { source: 'warning', step: 100 },
  danger: { source: 'danger', step: 600 },
  'danger-muted': { source: 'danger', step: 100 },
  info: { source: 'info', step: 600 },
  'info-muted': { source: 'info', step: 100 },

  'canvas-bg': { source: 'neutral', step: 100 },
  'canvas-grid': { source: 'neutral', step: 200 },
  'canvas-guide': { source: 'guide', step: 500 },
  'canvas-selection': { source: 'accent', offset: 0 },
  'canvas-hover': { source: 'accent', offset: 0, alpha: 0.5 },
  'canvas-snap': { source: 'snap', step: 500 },
}

const DARK_MAP: SemanticMap = {
  'surface-0': { source: 'neutral', step: 1000 },
  'surface-1': { source: 'neutral', step: 950 },
  'surface-2': { source: 'neutral', step: 900 },
  'surface-3': { source: 'neutral', step: 800 },
  'surface-inset': { source: 'neutral', step: 1000 },

  foreground: { source: 'neutral', step: 50 },
  'foreground-muted': { source: 'neutral', step: 400 },
  'foreground-subtle': { source: 'neutral', step: 400 },
  'foreground-onAccent': { source: 'neutral', step: 1000 },

  border: { source: 'neutral', step: 800 },
  'border-strong': { source: 'neutral', step: 700 },
  'border-subtle': { source: 'neutral', step: 900 },

  accent: { source: 'accent', offset: 0 },
  'accent-hover': { source: 'accent', offset: 1 },
  'accent-active': { source: 'accent', offset: 2 },
  'accent-muted': { source: 'accent', step: 900 },
  'accent-ring': { source: 'accent', offset: 0 },

  success: { source: 'success', step: 400 },
  'success-muted': { source: 'success', step: 900 },
  warning: { source: 'warning', step: 400 },
  'warning-muted': { source: 'warning', step: 900 },
  danger: { source: 'danger', step: 400 },
  'danger-muted': { source: 'danger', step: 900 },
  info: { source: 'info', step: 400 },
  'info-muted': { source: 'info', step: 900 },

  'canvas-bg': { source: 'neutral', step: 1000 },
  'canvas-grid': { source: 'neutral', step: 900 },
  'canvas-guide': { source: 'guide', step: 400 },
  'canvas-selection': { source: 'accent', offset: 0 },
  'canvas-hover': { source: 'accent', offset: 0, alpha: 0.5 },
  'canvas-snap': { source: 'snap', step: 400 },
}

export const SEMANTIC_MAP: Readonly<Record<ColorMode, SemanticMap>> = {
  light: LIGHT_MAP,
  dark: DARK_MAP,
}

/**
 * The direction the accent ladder walks, per mode. Light surfaces are pale so the ladder descends into
 * darker steps; dark surfaces are near-black so it ascends. One rule, two signs — ADR-019.
 */
export const LADDER_DIRECTION: Readonly<Record<ColorMode, 1 | -1>> = { light: 1, dark: -1 }

/** A step this many ladder positions along, saturating at the ends rather than wrapping. */
export function stepAt(from: RampStep, positions: number): RampStep {
  const index = RAMP_STEPS.indexOf(from) + positions
  const bounded = Math.min(Math.max(index, 0), RAMP_STEPS.length - 1)

  return RAMP_STEPS[bounded] ?? from
}
