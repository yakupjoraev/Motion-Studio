import { clampChroma, parseOklch } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import {
  CHROMA_CURVE,
  GAMUT_INSET,
  HUE_ANGLE,
  HUE_SHIFT_CURVE,
  LIGHTNESS_LADDER,
  NEUTRAL,
  RAMPS,
  RAMP_STEPS,
  REFERENCE_CHROMA,
  VIOLET,
  withAlpha,
} from './color'

/**
 * `DESIGN_SYSTEM.md` § Colour states that the six chromatic ramps are derived rather than picked, and
 * that regenerating them from the curves must reproduce their values. This suite is that check: it
 * recomputes every step from the documented formula and the shared `clampChroma`, so a transcription
 * typo fails here instead of shipping into all 62 blocks.
 *
 * Tolerance is half of the last documented digit. The ramps carry three decimals of chroma, so a
 * derived value further than 0.0005 away is a different number, not a rounding of the same one.
 */
const TOLERANCE = 0.0005

/** Wider than any sRGB chroma, so clamping it returns the gamut boundary itself. */
const BEYOND_GAMUT = 0.5

const hues = Object.keys(RAMPS) as Array<keyof typeof RAMPS>

const boundaryAt = (lightness: number, hue: number): number =>
  clampChroma(BEYOND_GAMUT, lightness, hue)

/**
 * Reading a curve by index under `noUncheckedIndexedAccess`. An index past the end yields `NaN`, which
 * fails every comparison below rather than passing silently — so the length assertions and the
 * per-step assertions cannot both be satisfied by a short curve.
 */
const at = (values: readonly number[], index: number): number => values[index] ?? Number.NaN

describe.each(hues)('%s ramp', (hue) => {
  const ramp = RAMPS[hue]
  const angle = HUE_ANGLE[hue]
  const steps = RAMP_STEPS.map((step, index) => ({ step, index, color: ramp[step] }))

  it.each(steps)('step $step sits inside the sRGB gamut', ({ color }) => {
    const { l, c, h } = parseOklch(color)

    expect(clampChroma(c, l, h)).toBeCloseTo(c, 6)
  })

  it.each(steps)('step $step reproduces the derivation formula', ({ index, color }) => {
    const lightness = at(LIGHTNESS_LADDER, index)
    const curve = at(CHROMA_CURVE, index)
    const derived = Math.min(
      REFERENCE_CHROMA[hue] * curve,
      GAMUT_INSET * boundaryAt(lightness, angle),
    )

    expect(parseOklch(color).c).toBeCloseTo(derived, 3)
    expect(Math.abs(parseOklch(color).c - derived)).toBeLessThan(TOLERANCE)
  })

  it('takes its lightness from the ladder at every step', () => {
    RAMP_STEPS.forEach((step, index) => {
      expect(parseOklch(ramp[step]).l).toBeCloseTo(at(LIGHTNESS_LADDER, index), 5)
    })
  })

  it('is hue-constant: only generated palettes drift', () => {
    for (const step of RAMP_STEPS) {
      expect(parseOklch(ramp[step]).h).toBeCloseTo(angle, 2)
    }
  })

  it('has the twelve steps the scale documents', () => {
    expect(Object.keys(ramp)).toHaveLength(12)
  })
})

describe('the three curves', () => {
  it('reads LIGHTNESS_LADDER straight off the NEUTRAL ramp', () => {
    RAMP_STEPS.forEach((step, index) => {
      expect(LIGHTNESS_LADDER[index]).toBeCloseTo(parseOklch(NEUTRAL[step]).l, 5)
    })
  })

  it('descends without a plateau, so no two steps read as the same surface', () => {
    for (let index = 1; index < LIGHTNESS_LADDER.length; index += 1) {
      expect(at(LIGHTNESS_LADDER, index)).toBeLessThan(at(LIGHTNESS_LADDER, index - 1))
    }
  })

  it("is NEUTRAL's own chroma curve normalised to its peak", () => {
    const chromas = RAMP_STEPS.map((step) => parseOklch(NEUTRAL[step]).c)
    const peak = Math.max(...chromas)

    chromas.forEach((chroma, index) => {
      expect(at(CHROMA_CURVE, index)).toBeCloseTo(chroma / peak, 3)
    })
  })

  it('peaks the chroma curve around step 500 and tapers both ways', () => {
    const peakIndex = RAMP_STEPS.indexOf(500)

    expect(CHROMA_CURVE[peakIndex]).toBe(1)
    expect(at(CHROMA_CURVE, 0)).toBeLessThan(1)
    expect(at(CHROMA_CURVE, CHROMA_CURVE.length - 1)).toBeLessThan(1)
  })

  it('runs the hue shift from +1 to -1 through zero at the chroma peak', () => {
    expect(HUE_SHIFT_CURVE[0]).toBe(1)
    expect(HUE_SHIFT_CURVE[HUE_SHIFT_CURVE.length - 1]).toBe(-1)
    expect(HUE_SHIFT_CURVE[RAMP_STEPS.indexOf(500)]).toBe(0)
    expect(HUE_SHIFT_CURVE[RAMP_STEPS.indexOf(600)]).toBe(0)
  })

  it('gives all three curves one entry per ramp step', () => {
    expect(LIGHTNESS_LADDER).toHaveLength(RAMP_STEPS.length)
    expect(CHROMA_CURVE).toHaveLength(RAMP_STEPS.length)
    expect(HUE_SHIFT_CURVE).toHaveLength(RAMP_STEPS.length)
  })
})

describe('REFERENCE_CHROMA', () => {
  const step500Lightness = at(LIGHTNESS_LADDER, RAMP_STEPS.indexOf(500))

  it.each(hues.filter((hue) => hue !== 'neutral'))(
    '%s is 95%% of the gamut boundary at step 500',
    (hue) => {
      const boundary = boundaryAt(step500Lightness, HUE_ANGLE[hue])

      expect(REFERENCE_CHROMA[hue]).toBeCloseTo(GAMUT_INSET * boundary, 3)
    },
  )

  it('holds neutral at its own peak chroma instead, since it is a near-grey by design', () => {
    expect(REFERENCE_CHROMA.neutral).toBeCloseTo(parseOklch(NEUTRAL[500]).c, 5)
  })

  it('leaves amber and cyan far less chromatic at step 500 than violet and rose', () => {
    // The documented cost of one shared lightness ladder: sRGB has much less room for those hues at
    // 58 % lightness, so `amber.500` reads closer to bronze than to yellow.
    expect(REFERENCE_CHROMA.amber).toBeLessThan(REFERENCE_CHROMA.violet / 1.5)
    expect(REFERENCE_CHROMA.cyan).toBeLessThan(REFERENCE_CHROMA.rose / 1.5)
  })
})

describe('withAlpha', () => {
  it('keeps the step byte-identical and appends the alpha', () => {
    expect(withAlpha(VIOLET[600], 0.5)).toBe('oklch(46.5% 0.229 285 / 0.5)')
  })

  it('rejects a value that already carries an alpha', () => {
    expect(() => withAlpha('oklch(46.5% 0.229 285 / 0.4)', 0.5)).toThrow(/alpha-free/)
  })

  it('rejects a colour that is not an oklch literal', () => {
    expect(() => withAlpha('#7c3aed', 0.5)).toThrow(/alpha-free/)
  })
})
