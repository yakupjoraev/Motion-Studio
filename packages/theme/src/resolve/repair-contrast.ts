import {
  type ColorMode,
  RAMP_STEPS,
  type RampStep,
  type SemanticColorToken,
} from '@motion-studio/tokens'
import { contrastRatio } from '@motion-studio/utils'

import { type PaletteRamps, buildSemanticColors } from './build-palette'
import { LADDER_DIRECTION } from './semantic-map'

import type { ContrastRepair } from '../theme.types'

/**
 * `THEME_ENGINE.md` § Contrast repair. After generating, verify every pair the accent family
 * participates in; on a failure walk the ramp to the next step that passes and record the substitution.
 *
 * Both halves of the prompt's sentence are structural here: the function **never silently overrides the
 * user**, because every substitution comes back in the report for the theme builder to show inline, and
 * it **never silently ships a failing pair**, because a pair that no step can fix comes back as a
 * warning rather than being dropped.
 *
 * Only the accent family is repairable. The surfaces, the status hues and the canvas feedback hues are
 * fixed positions in the semantic table — moving those would not repair a theme, it would replace the
 * design system.
 */

/** The pairs the accent family has to clear, and the threshold for each. */
export type AccentPair = readonly [SemanticColorToken, SemanticColorToken, number]

const ACCENT_PAIRS: readonly AccentPair[] = [
  ['foreground-onAccent', 'accent', 4.5],
  ['foreground-onAccent', 'accent-hover', 4.5],
  ['foreground-onAccent', 'accent-active', 4.5],
  ['accent-ring', 'surface-1', 4.5],
  ['accent-ring', 'surface-2', 4.5],
  ['accent-ring', 'surface-3', 4.5],
  ['accent-ring', 'surface-0', 3],
  ['accent-ring', 'surface-inset', 3],
  // A primary button is identified by its fill, so the fill is information — ADR-019.
  ['accent', 'surface-0', 3],
  ['accent', 'surface-1', 3],
  ['accent', 'surface-2', 3],
  ['accent', 'surface-3', 3],
  ['accent', 'surface-inset', 3],
  ['foreground', 'accent-muted', 4.5],
]

export interface RepairResult {
  readonly accentStep: RampStep
  readonly repairs: readonly ContrastRepair[]
  readonly warnings: readonly string[]
}

interface Failure {
  readonly token: SemanticColorToken
  readonly against: SemanticColorToken
  readonly required: number
  readonly measured: number
}

function firstFailure(
  mode: ColorMode,
  ramps: PaletteRamps,
  step: RampStep,
  pairs: readonly AccentPair[],
): Failure | undefined {
  const colors = buildSemanticColors(mode, ramps, step)

  for (const [token, against, required] of pairs) {
    const measured = contrastRatio(colors[token], colors[against])
    if (measured < required) {
      return { token, against, required, measured }
    }
  }

  return undefined
}

/**
 * Walks the accent step away from the mode's surfaces — the direction that raises contrast against them
 * — and stops at the first step where every accent pair passes. Candidates are tried nearest-first, so a
 * repaired theme stays as close to the user's pick as the thresholds allow.
 */
export function repairContrast(
  mode: ColorMode,
  ramps: PaletteRamps,
  pairs: readonly AccentPair[] = ACCENT_PAIRS,
): RepairResult {
  const start = RAMP_STEPS.indexOf(ramps.accentStep)
  const direction = LADDER_DIRECTION[mode]
  const initial = firstFailure(mode, ramps, ramps.accentStep, pairs)

  if (initial === undefined) {
    return { accentStep: ramps.accentStep, repairs: [], warnings: [] }
  }

  for (let distance = 1; distance < RAMP_STEPS.length; distance += 1) {
    const index = start + distance * direction
    const candidate = RAMP_STEPS[index]

    if (candidate === undefined) {
      break
    }
    if (firstFailure(mode, ramps, candidate, pairs) === undefined) {
      return {
        accentStep: candidate,
        repairs: [describe(initial, ramps, candidate, mode)],
        warnings: [],
      }
    }
  }

  return {
    accentStep: ramps.accentStep,
    repairs: [],
    warnings: [
      `${initial.token} on ${initial.against} is ${initial.measured.toFixed(2)}:1, under ${initial.required}:1, ` +
        `and no step of this accent ramp reaches it in ${mode} mode. Pick a ${
          mode === 'light' ? 'darker' : 'lighter'
        } or more saturated accent.`,
    ],
  }
}

function describe(
  failure: Failure,
  ramps: PaletteRamps,
  repairedStep: RampStep,
  mode: ColorMode,
): ContrastRepair {
  const before = buildSemanticColors(mode, ramps, ramps.accentStep)
  const after = buildSemanticColors(mode, ramps, repairedStep)
  const repaired = contrastRatio(after[failure.token], after[failure.against])

  return {
    token: failure.token,
    against: failure.against,
    required: failure.required,
    measured: failure.measured,
    // What moved is the accent, not the token that failed: `foreground-onAccent` is a neutral step and
    // does not change when the ladder does, so reporting it would show the same value twice.
    from: before.accent,
    to: after.accent,
    step: repairedStep,
    repaired,
    message:
      `${failure.token} on ${failure.against} was ${failure.measured.toFixed(2)}:1 — ` +
      `using accent step ${repairedStep} instead, which measures ${repaired.toFixed(2)}:1.`,
  }
}
