import { NEUTRAL, RAMP_STEPS, REFERENCE_CHROMA } from '@motion-studio/tokens'
import { contrastRatio, formatOklch, parseOklch } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { buildRamps, buildSemanticColors } from './build-palette'
import { generateRamp } from './generate-ramp'
import { NEUTRAL_FAMILY, NEUTRAL_HUES } from './neutral'

import type { NeutralHue } from '../theme.types'

/** ADR-022's criteria, as assertions. */
const rampFor = (family: NeutralHue) =>
  generateRamp(
    formatOklch(
      0.58,
      REFERENCE_CHROMA.neutral * NEUTRAL_FAMILY[family].chroma,
      NEUTRAL_FAMILY[family].hue,
    ),
    { saturation: 1, hueShift: 0 },
  )

describe('the six neutral families', () => {
  it('ships exactly six', () => {
    expect(NEUTRAL_HUES).toHaveLength(6)
  })

  it('keeps slate identical to the shipped NEUTRAL ramp', () => {
    // Criterion 1: the default preset must not change what prompt 04 already contrast-verified.
    const slate = rampFor('slate')

    for (const step of RAMP_STEPS) {
      expect(parseOklch(slate[step]).c, `${step}`).toBeCloseTo(parseOklch(NEUTRAL[step]).c, 5)
      expect(parseOklch(slate[step]).h, `${step}`).toBeCloseTo(parseOklch(NEUTRAL[step]).h, 5)
    }
  })

  it('gives no two families the same twelve strings', () => {
    // Criterion 2: a name that renders identically to another name is a control with no effect.
    const rendered = NEUTRAL_HUES.map((family) => JSON.stringify(rampFor(family)))

    expect(new Set(rendered).size).toBe(NEUTRAL_HUES.length)
  })

  it('makes gray achromatic at every step', () => {
    const gray = rampFor('gray')

    for (const step of RAMP_STEPS) {
      expect(parseOklch(gray[step]).c, `${step}`).toBe(0)
    }
  })

  it('covers both temperature directions around slate', () => {
    // Criterion 4. Hue angles below slate's 265 are warm; above it, cool toward violet.
    const warmer = NEUTRAL_HUES.filter((family) => NEUTRAL_FAMILY[family].hue < 200)
    const cooler = NEUTRAL_HUES.filter((family) => NEUTRAL_FAMILY[family].hue >= 230)

    expect(warmer.length).toBeGreaterThanOrEqual(2)
    expect(cooler.length).toBeGreaterThanOrEqual(2)
  })

  it('mirrors the warm and cool pairs in strength', () => {
    expect(NEUTRAL_FAMILY.warm.chroma).toBe(NEUTRAL_FAMILY.cool.chroma)
    expect(NEUTRAL_FAMILY.stone.chroma).toBe(NEUTRAL_FAMILY.zinc.chroma)
  })
})

describe('every family passes the contrast gate', () => {
  const TEXT_PAIRS = [
    ['foreground', 'surface-0'],
    ['foreground', 'surface-1'],
    ['foreground', 'surface-2'],
    ['foreground', 'surface-3'],
    ['foreground', 'surface-inset'],
    ['foreground-muted', 'surface-0'],
    ['foreground-muted', 'surface-1'],
    ['foreground-muted', 'surface-2'],
    ['foreground-muted', 'surface-3'],
  ] as const

  const UI_PAIRS = [
    ['foreground-subtle', 'surface-0'],
    ['foreground-subtle', 'surface-1'],
    ['foreground-subtle', 'surface-2'],
    ['foreground-subtle', 'surface-3'],
  ] as const

  it.each(NEUTRAL_HUES)('%s clears every surface pair in both modes', (family) => {
    for (const mode of ['light', 'dark'] as const) {
      const ramps = buildRamps({
        accent: formatOklch(0.465, 0.2592, 285),
        neutral: family,
        accentHueShift: 0,
        saturation: 1,
      })
      const colors = buildSemanticColors(mode, ramps, mode === 'light' ? 600 : 400)

      for (const [foreground, background] of TEXT_PAIRS) {
        expect(
          contrastRatio(colors[foreground], colors[background]),
          `${family} ${mode} ${foreground}/${background}`,
        ).toBeGreaterThanOrEqual(4.5)
      }
      for (const [foreground, background] of UI_PAIRS) {
        expect(
          contrastRatio(colors[foreground], colors[background]),
          `${family} ${mode} ${foreground}/${background}`,
        ).toBeGreaterThanOrEqual(3)
      }
    }
  })
})
