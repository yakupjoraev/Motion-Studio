import { describe, expect, it } from 'vitest'

import { SHADOW, SHADOW_STATIC, type ShadowSet } from './shadow'

/**
 * `DESIGN_SYSTEM.md` § The four elevation styles states each style as a *transform* of `soft`, so what
 * is worth asserting is the transform's shape rather than the strings. A style that quietly stopped
 * being a transform — a `sharp` level that kept its ambient layer, a `glow` that lost its accent —
 * would still look plausible in review.
 */

const STYLES = ['flat', 'soft', 'sharp', 'glow'] as const
const MODES = ['light', 'dark'] as const
const LEVELS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const

const layers = (value: string): number => value.split('),').length

const sets: Array<{ style: (typeof STYLES)[number]; mode: 'light' | 'dark'; set: ShadowSet }> =
  STYLES.flatMap((style) => MODES.map((mode) => ({ style, mode, set: SHADOW[style][mode] })))

describe.each(sets)('$style / $mode', ({ style, set }) => {
  it.each(LEVELS)('declares level %s', (level) => {
    expect(set[level].length).toBeGreaterThan(0)
  })

  it('is none at every level only when flat', () => {
    const allNone = LEVELS.every((level) => set[level] === 'none')

    expect(allNone).toBe(style === 'flat')
  })
})

describe('soft', () => {
  it('layers a contact shadow and a diffuse ambient one from sm upward', () => {
    for (const level of ['sm', 'md', 'lg', 'xl', '2xl'] as const) {
      expect(layers(SHADOW.soft.light[level]), level).toBe(2)
    }
  })

  it('gives dark an inset highlight instead of a stronger black shadow at xs', () => {
    // A black shadow on a dark surface is invisible, so the lightest dark level is the highlight only.
    expect(SHADOW.soft.dark.xs).toContain('inset')
    expect(SHADOW.soft.dark.xs).not.toContain('oklch(0%')
    expect(SHADOW.soft.light.xs).toContain('oklch(0%')
  })

  it('keeps an inset highlight on every dark level', () => {
    for (const level of LEVELS) {
      expect(SHADOW.soft.dark[level], level).toContain('inset 0 1px 0')
    }
  })
})

describe('sharp', () => {
  it('drops the ambient layer, leaving one shadow per level', () => {
    for (const mode of MODES) {
      for (const level of LEVELS) {
        expect(layers(SHADOW.sharp[mode][level]), `${mode} ${level}`).toBe(1)
      }
    }
  })

  it('drops the inset highlight in dark, which belongs to the soft layered look', () => {
    for (const level of LEVELS) {
      expect(SHADOW.sharp.dark[level], level).not.toContain('inset')
    }
  })

  it('halves the contact blur and doubles its opacity against soft', () => {
    // soft light xs is `0 1px 2px … / 0.05`; sharp is `0 1px 1px … / 0.10`.
    expect(SHADOW.soft.light.xs).toContain('0 1px 2px')
    expect(SHADOW.soft.light.xs).toContain('/ 0.05')
    expect(SHADOW.sharp.light.xs).toContain('0 1px 1px')
    expect(SHADOW.sharp.light.xs).toContain('/ 0.10')
  })
})

describe('glow', () => {
  it('leaves xs and sm as soft, since a glow under 8px reads as a rendering artefact', () => {
    for (const mode of MODES) {
      expect(SHADOW.glow[mode].xs).toBe(SHADOW.soft[mode].xs)
      expect(SHADOW.glow[mode].sm).toBe(SHADOW.soft[mode].sm)
    }
  })

  it('appends an accent-tinted layer from md upward, in both modes', () => {
    for (const mode of MODES) {
      for (const level of ['md', 'lg', 'xl', '2xl'] as const) {
        const value = SHADOW.glow[mode][level]

        expect(value.startsWith(SHADOW.soft[mode][level]), `${mode} ${level}`).toBe(true)
        expect(value, `${mode} ${level}`).toContain('var(--ms-color-accent)')
      }
    }
  })

  it('widens the glow and raises its opacity with elevation', () => {
    expect(SHADOW.glow.light.md).toContain('0 0 16px')
    expect(SHADOW.glow.light.md).toContain('accent) 10%')
    expect(SHADOW.glow.light['2xl']).toContain('0 0 64px')
    expect(SHADOW.glow.light['2xl']).toContain('accent) 22%')
  })
})

describe('focus and glow-accent', () => {
  it('are identical across all four styles, so the ring never disappears with a theme change', () => {
    // They live outside SHADOW for exactly that reason: there is one value, not four.
    expect(Object.keys(SHADOW_STATIC)).toEqual(['focus', 'glow-accent'])
    for (const style of STYLES) {
      expect(Object.keys(SHADOW[style].light)).not.toContain('focus')
    }
  })

  it('draws the focus ring as a surface gap then the accent ring', () => {
    expect(SHADOW_STATIC.focus).toBe(
      '0 0 0 2px var(--ms-color-surface-0), 0 0 0 4px var(--ms-color-accent-ring)',
    )
  })

  it('resolves both through runtime variables, so a theme change repaints without a re-render', () => {
    expect(SHADOW_STATIC['glow-accent']).toContain('var(--ms-color-accent)')
  })
})
