import { DARK, LIGHT, NEUTRAL, REFERENCE_CHROMA, VIOLET } from '@motion-studio/tokens'
import { formatOklch } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { type PaletteRamps, buildSemanticColors } from './build-palette'
import { SEMANTIC_MAP, stepAt } from './semantic-map'

/**
 * The anti-drift guard. `semantic-map.ts` restates `DESIGN_SYSTEM.md`'s table as steps because a generated
 * palette needs steps, and `packages/tokens` holds the same table already applied to the shipped ramps.
 * Two copies of one table drift; this asserts they cannot.
 */
const SHIPPED: PaletteRamps = {
  accent: VIOLET,
  neutral: NEUTRAL,
  // The step the shipped maps use is per mode, so each assertion passes its own.
  accentStep: 600,
}

describe('the step table reproduces the shipped semantic maps', () => {
  it('reproduces LIGHT exactly', () => {
    expect(buildSemanticColors('light', SHIPPED, 600)).toEqual(LIGHT)
  })

  it('reproduces DARK exactly', () => {
    expect(buildSemanticColors('dark', SHIPPED, 400)).toEqual(DARK)
  })

  it('covers every token the interface declares, in both modes', () => {
    expect(Object.keys(SEMANTIC_MAP.light).sort()).toEqual(Object.keys(LIGHT).sort())
    expect(Object.keys(SEMANTIC_MAP.dark).sort()).toEqual(Object.keys(DARK).sort())
  })
})

describe('the accent ladder', () => {
  const ramps: PaletteRamps = {
    accent: VIOLET,
    neutral: NEUTRAL,
    accentStep: 500,
  }

  it('descends in light mode, away from pale surfaces', () => {
    const colors = buildSemanticColors('light', ramps, 500)

    expect(colors.accent).toBe(VIOLET[500])
    expect(colors['accent-hover']).toBe(VIOLET[600])
    expect(colors['accent-active']).toBe(VIOLET[700])
  })

  it('ascends in dark mode, away from near-black surfaces', () => {
    const colors = buildSemanticColors('dark', ramps, 500)

    expect(colors.accent).toBe(VIOLET[500])
    expect(colors['accent-hover']).toBe(VIOLET[400])
    expect(colors['accent-active']).toBe(VIOLET[300])
  })

  it('bakes the canvas hover alpha into the token', () => {
    expect(buildSemanticColors('light', ramps, 500)['canvas-hover']).toContain('/ 0.5)')
  })

  it('keeps the status hues fixed when the accent changes', () => {
    const shifted: PaletteRamps = {
      ...ramps,
      accent: { ...VIOLET, 500: formatOklch(0.58, REFERENCE_CHROMA.emerald, 160) },
    }

    expect(buildSemanticColors('light', shifted, 500).success).toBe(LIGHT.success)
    expect(buildSemanticColors('light', shifted, 500)['canvas-guide']).toBe(LIGHT['canvas-guide'])
  })
})

describe('stepAt', () => {
  it('moves along the ladder by position', () => {
    expect(stepAt(500, 1)).toBe(600)
    expect(stepAt(500, -2)).toBe(300)
    expect(stepAt(500, 0)).toBe(500)
  })

  it('saturates at the ends rather than wrapping, so a ladder never jumps hue extremes', () => {
    expect(stepAt(50, -3)).toBe(50)
    expect(stepAt(1000, 4)).toBe(1000)
  })
})
