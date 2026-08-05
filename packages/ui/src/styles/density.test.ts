import { describe, expect, it } from 'vitest'

import { DENSITY, type DensityToken, HEIGHT_CLASS, LABEL_COLUMN_CLASS } from './density'

/**
 * `UI_GUIDELINES.md` § Density scale is a table in a document; this asserts the code still says the same
 * numbers. The scale is the studio's rhythm — a drift here is a drift in every panel at once.
 */
const DOCUMENTED: Readonly<Record<DensityToken, number>> = {
  topBar: 48,
  statusBar: 28,
  tabStrip: 36,
  sectionHeader: 32,
  controlRow: 28,
  input: 26,
  smallButton: 24,
  iconButton: 28,
  layerRow: 26,
  blockCard: 88,
}

describe('the density scale', () => {
  it.each(Object.entries(DOCUMENTED))('puts %s at %ipx', (token, height) => {
    expect(DENSITY[token as DensityToken]).toBe(height)
  })

  it('carries exactly the ten rows the table lists', () => {
    expect(Object.keys(DENSITY).sort()).toEqual(Object.keys(DOCUMENTED).sort())
  })

  it('gives every row a Tailwind class carrying the same number', () => {
    for (const [token, height] of Object.entries(DENSITY)) {
      expect(HEIGHT_CLASS[token as DensityToken], token).toContain(`${height}px`)
    }
  })

  it('makes the icon button square, as the table writes it: 28 × 28', () => {
    expect(HEIGHT_CLASS.iconButton).toBe('h-[28px] w-[28px]')
  })

  it('writes every class out literally, because Tailwind scans source text', () => {
    // An interpolated `h-[${n}px]` produces no CSS at all, so the values cannot be generated from DENSITY.
    for (const className of Object.values(HEIGHT_CLASS)) {
      expect(className).not.toContain('$')
    }
  })

  it('fixes the control-row label column at 88px', () => {
    expect(LABEL_COLUMN_CLASS).toBe('w-[88px]')
  })

  it('keeps the control row at 28px, which everything else follows', () => {
    expect(DENSITY.controlRow).toBe(28)
    expect(DENSITY.statusBar).toBe(DENSITY.controlRow)
    expect(DENSITY.iconButton).toBe(DENSITY.controlRow)
  })
})
