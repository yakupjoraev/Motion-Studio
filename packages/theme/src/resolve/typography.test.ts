import { FONT_FAMILY, TYPE_SCALE } from '@motion-studio/tokens'
import { describe, expect, it } from 'vitest'

import { FONT_PAIRING, scaleTypeScale } from './typography'

import type { FontPairingId } from '../theme.types'

const PAIRINGS = Object.keys(FONT_PAIRING) as FontPairingId[]

describe('FONT_PAIRING', () => {
  it('ships five, closing the document’s open set', () => {
    expect(PAIRINGS).toHaveLength(5)
  })

  it('keeps geist identical to the shipped families', () => {
    expect(FONT_PAIRING.geist.sans).toBe(FONT_FAMILY.sans)
    expect(FONT_PAIRING.geist.display).toBe(FONT_FAMILY.display)
    expect(FONT_PAIRING.geist.mono).toBe(FONT_FAMILY.mono)
  })

  it.each(PAIRINGS)('gives %s all three roles and a label', (id) => {
    const pairing = FONT_PAIRING[id]

    expect(pairing.label.length).toBeGreaterThan(0)
    expect(pairing.sans.length).toBeGreaterThan(0)
    expect(pairing.display.length).toBeGreaterThan(0)
    expect(pairing.mono.length).toBeGreaterThan(0)
  })

  it.each(PAIRINGS)('ends every %s stack in a generic keyword, which CSS requires', (id) => {
    const pairing = FONT_PAIRING[id]

    expect(pairing.sans.endsWith('sans-serif')).toBe(true)
    expect(pairing.display.endsWith('sans-serif')).toBe(true)
    expect(pairing.mono.endsWith('monospace')).toBe(true)
  })

  it('closes the set with a pairing that needs no downloaded font', () => {
    expect(FONT_PAIRING.system.sans).not.toContain("'")
    expect(FONT_PAIRING.system.mono).not.toContain("'")
  })
})

describe('scaleTypeScale', () => {
  it('returns the shipped table unchanged at the authored base', () => {
    expect(scaleTypeScale(14)).toEqual(
      Object.fromEntries(
        Object.entries(TYPE_SCALE).map(([token, entry]) => [
          token,
          { size: entry.size, lineHeight: entry.lineHeight, tracking: entry.tracking },
        ]),
      ),
    )
  })

  it('scales every fixed step proportionally', () => {
    const scaled = scaleTypeScale(16)

    expect(scaled.base.size).toBe('16px')
    expect(scaled.md.size).toBe('18.3px')
    expect(scaled['2xs'].size).toBe('11.4px')
  })

  it('scales line heights with their sizes', () => {
    const scaled = scaleTypeScale(16)

    expect(scaled.base.lineHeight).toBe('24px')
  })

  it('leaves tracking alone, because em is already proportional', () => {
    expect(scaleTypeScale(16)['2xl'].tracking).toBe(TYPE_SCALE['2xl'].tracking)
  })

  it('leaves the fluid display steps alone', () => {
    // They are clamp() over viewport units — content typography, not studio density.
    const scaled = scaleTypeScale(16)

    expect(scaled['display-1'].size).toBe(TYPE_SCALE['display-1'].size)
    expect(scaled['display-1'].lineHeight).toBe(TYPE_SCALE['display-1'].lineHeight)
    expect(scaled['display-2'].size).toBe(TYPE_SCALE['display-2'].size)
  })

  it('keeps the scale ascending at every base size', () => {
    for (const base of [14, 15, 16] as const) {
      const sizes = Object.values(scaleTypeScale(base))
        .filter((entry) => entry.size.endsWith('px'))
        .map((entry) => Number.parseFloat(entry.size))

      expect(sizes, `base ${base}`).toEqual([...sizes].sort((a, b) => a - b))
    }
  })

  it('gives no two steps the same size, which integer rounding would have done', () => {
    const sizes = Object.values(scaleTypeScale(15))
      .filter((entry) => entry.size.endsWith('px'))
      .map((entry) => entry.size)

    expect(new Set(sizes).size).toBe(sizes.length)
  })
})
