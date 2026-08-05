import { NEUTRAL, RAMP_STEPS, REFERENCE_CHROMA, VIOLET } from '@motion-studio/tokens'
import { clampChroma, formatOklch, parseOklch } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { accentStepFor, generateRamp, normaliseHue, seedSaturation } from './generate-ramp'

/** One unit in the last digit the shipped ramp tables carry, so agreement within it is exact. */
const TABLE_PRECISION = 0.001

/** Twenty seeds across the hue circle and the lightness ladder, deterministic rather than random. */
const SAMPLED_SEEDS = Array.from({ length: 20 }, (_, index) => {
  const hue = (index * 360) / 20
  const lightness = 0.12 + (index % 5) * 0.19

  return formatOklch(lightness, 0.95 * clampChroma(0.5, lightness, hue), hue)
})

describe('generateRamp', () => {
  it.each(SAMPLED_SEEDS)('is in gamut at every step for seed %s', (seed) => {
    const ramp = generateRamp(seed, { saturation: 1, hueShift: 0 })

    for (const step of RAMP_STEPS) {
      const { l, c, h } = parseOklch(ramp[step])

      expect(clampChroma(c, l, h), `${step}`).toBeCloseTo(c, 6)
    }
  })

  it.each(SAMPLED_SEEDS)('stays in gamut at maximum saturation and hue shift for %s', (seed) => {
    const ramp = generateRamp(seed, { saturation: 1.5, hueShift: 30 })

    for (const step of RAMP_STEPS) {
      const { l, c, h } = parseOklch(ramp[step])

      expect(clampChroma(c, l, h), `${step}`).toBeCloseTo(c, 6)
    }
  })

  it('reproduces the shipped VIOLET ramp from a violet seed', () => {
    // The document's claim that "the shipped ramps and a generated palette have the same character" is
    // testable, and this is the test — ADR-023.
    const ramp = generateRamp(VIOLET[500], { saturation: 1, hueShift: 0 })

    for (const step of RAMP_STEPS) {
      const delta = Math.abs(parseOklch(ramp[step]).c - parseOklch(VIOLET[step]).c)

      expect(delta, `${step}`).toBeLessThanOrEqual(TABLE_PRECISION)
    }
  })

  it('reproduces the shipped NEUTRAL ramp from a neutral seed', () => {
    // Compared as numbers, not strings: `formatOklch` emits a fixed precision — `oklch(98.50% 0.0020
    // 265.00)` — where the shipped table is hand-written as `oklch(98.5% 0.002 265)`. Same colour.
    const seed = formatOklch(0.58, REFERENCE_CHROMA.neutral, 265)
    const ramp = generateRamp(seed, { saturation: 1, hueShift: 0 })

    for (const step of RAMP_STEPS) {
      const generated = parseOklch(ramp[step])
      const shipped = parseOklch(NEUTRAL[step])

      expect(generated.l, `${step} lightness`).toBeCloseTo(shipped.l, 5)
      expect(generated.c, `${step} chroma`).toBeCloseTo(shipped.c, 5)
      expect(generated.h, `${step} hue`).toBeCloseTo(shipped.h, 5)
    }
  })

  it('reproduces the same ramp from two steps of it, because saturation is relative', () => {
    const fromMiddle = generateRamp(VIOLET[500], { saturation: 1, hueShift: 0 })
    const fromLight = generateRamp(VIOLET[400], { saturation: 1, hueShift: 0 })

    expect(fromLight).toEqual(fromMiddle)
  })

  it('holds the lightness ladder regardless of the seed lightness', () => {
    const pale = generateRamp(VIOLET[200], { saturation: 1, hueShift: 0 })
    const deep = generateRamp(VIOLET[900], { saturation: 1, hueShift: 0 })

    for (const step of RAMP_STEPS) {
      expect(parseOklch(pale[step]).l).toBeCloseTo(parseOklch(deep[step]).l, 6)
    }
  })

  it('drifts the light end up and the dark end down under a positive hue shift', () => {
    const ramp = generateRamp(VIOLET[500], { saturation: 1, hueShift: 30 })

    expect(parseOklch(ramp[50]).h).toBeCloseTo(315, 1)
    expect(parseOklch(ramp[500]).h).toBeCloseTo(285, 1)
    expect(parseOklch(ramp[1000]).h).toBeCloseTo(255, 1)
  })

  it('leaves the ramp hue-constant at zero shift', () => {
    const ramp = generateRamp(VIOLET[500], { saturation: 1, hueShift: 0 })

    for (const step of RAMP_STEPS) {
      expect(parseOklch(ramp[step]).h, `${step}`).toBeCloseTo(285, 2)
    }
  })

  it('lowers chroma proportionally as saturation falls', () => {
    const full = generateRamp(VIOLET[500], { saturation: 1, hueShift: 0 })
    const half = generateRamp(VIOLET[500], { saturation: 0.5, hueShift: 0 })

    expect(parseOklch(half[500]).c).toBeCloseTo(parseOklch(full[500]).c / 2, 3)
  })

  it('produces an achromatic ramp from an achromatic seed', () => {
    const ramp = generateRamp(formatOklch(0.58, 0, 0), { saturation: 1.5, hueShift: 30 })

    for (const step of RAMP_STEPS) {
      expect(parseOklch(ramp[step]).c, `${step}`).toBe(0)
    }
  })
})

describe('seedSaturation', () => {
  it('returns 1 for a seed on the inset gamut boundary', () => {
    const { l, c, h } = parseOklch(VIOLET[500])

    expect(seedSaturation(l, c, h)).toBeCloseTo(1, 3)
  })

  it('returns the same value for two steps that both ride the boundary', () => {
    const middle = parseOklch(VIOLET[500])
    const light = parseOklch(VIOLET[400])

    expect(seedSaturation(light.l, light.c, light.h)).toBeCloseTo(
      seedSaturation(middle.l, middle.c, middle.h),
      3,
    )
  })

  it('measures a step below the boundary as proportionally less saturated', () => {
    const { l, c, h } = parseOklch(VIOLET[600])

    // violet.600 carries 0.229 where its lightness allows 0.259.
    expect(seedSaturation(l, c, h)).toBeCloseTo(0.883, 2)
  })

  it('is 0 for an achromatic seed, where no ceiling exists to divide by', () => {
    expect(seedSaturation(1, 0, 0)).toBe(0)
  })

  it('never exceeds 1, even for a seed outside the gamut', () => {
    expect(seedSaturation(0.58, 0.9, 285)).toBe(1)
  })
})

describe('accentStepFor', () => {
  it.each([
    [50, 50],
    [400, 400],
    [500, 500],
    [600, 600],
    [1000, 1000],
  ])('picks step %i from that step as the seed', (step, expected) => {
    expect(accentStepFor(VIOLET[step as 50])).toBe(expected)
  })

  it('gives a pale seed a light step rather than the mid default', () => {
    // The document's own example: "a user picking a pale colour gets step 400 as their accent, not 600".
    expect(accentStepFor(formatOklch(0.71, 0.15, 285))).toBe(400)
  })

  it('picks the nearest step for a lightness between two', () => {
    // 0.50 sits 0.035 from step 600's 0.465 and 0.08 from step 500's 0.58.
    expect(accentStepFor(formatOklch(0.5, 0.1, 285))).toBe(600)
  })
})

describe('normaliseHue', () => {
  it.each([
    [0, 0],
    [360, 0],
    [-30, 330],
    [390, 30],
    [285, 285],
  ])('maps %i to %i', (input, expected) => {
    expect(normaliseHue(input)).toBe(expected)
  })
})
