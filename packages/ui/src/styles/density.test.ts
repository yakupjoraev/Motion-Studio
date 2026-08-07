import { describe, expect, it } from 'vitest'

import {
  DENSITY,
  type DensityToken,
  GLYPH,
  GLYPH_CLASS,
  type GlyphToken,
  HEIGHT_CLASS,
  LABEL_COLUMN_CLASS,
  MIN_TARGET,
  MIN_TARGET_CLASS,
} from './density'

/** The document's table, transcribed. A drift here is a drift in every panel at once. */
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

/** § Control glyphs, the same way. */
const DOCUMENTED_GLYPHS: Readonly<Record<GlyphToken, number>> = {
  checkboxBox: 16,
  switchTrackWidth: 24,
  switchTrackHeight: 14,
  switchThumb: 10,
  sliderTrack: 4,
  sliderThumb: 12,
}

describe('the control glyph scale', () => {
  it.each(Object.entries(DOCUMENTED_GLYPHS))('puts %s at %ipx', (token, size) => {
    expect(GLYPH[token as GlyphToken]).toBe(size)
  })

  it('carries exactly the six glyphs the table lists', () => {
    expect(Object.keys(GLYPH).sort()).toEqual(Object.keys(DOCUMENTED_GLYPHS).sort())
  })

  it('writes every glyph class out literally, for the same reason the row classes are', () => {
    for (const className of Object.values(GLYPH_CLASS)) {
      expect(className).not.toContain('$')
    }
  })

  it.each([
    ['checkboxBox', GLYPH_CLASS.checkboxBox, ['16px']],
    ['switchTrack', GLYPH_CLASS.switchTrack, ['14px', '24px']],
    ['switchThumb', GLYPH_CLASS.switchThumb, ['10px']],
    ['sliderTrack', GLYPH_CLASS.sliderTrack, ['4px']],
    ['sliderThumb', GLYPH_CLASS.sliderThumb, ['12px']],
  ] as const)('gives %s a class carrying its documented size', (_token, className, sizes) => {
    for (const size of sizes) {
      expect(className).toContain(size)
    }
  })

  // ADR-030's four admission rules, so an edit that breaks one has to argue with the ADR.
  it('derives every glyph from a row in the density scale', () => {
    expect(GLYPH.switchTrackWidth).toBe(DENSITY.smallButton)
    expect(GLYPH.switchTrackHeight).toBe(DENSITY.controlRow / 2)
    expect(GLYPH.switchThumb).toBe(GLYPH.switchTrackHeight - 2 * 2)
    expect(GLYPH.sliderThumb).toBe(DENSITY.smallButton / 2)
  })

  it('keeps every glyph on whole pixels when centred in an even row', () => {
    for (const [token, size] of Object.entries(GLYPH)) {
      expect(size % 2, token).toBe(0)
    }
  })

  it('leaves at least 4px of clearance inside the input band', () => {
    const tallest = Math.max(GLYPH.checkboxBox, GLYPH.switchTrackHeight, GLYPH.sliderThumb)

    expect(DENSITY.input - tallest).toBeGreaterThanOrEqual(2 * 4)
  })

  it('sets the minimum target at the small-button row, and not below WCAG 2.2 AA', () => {
    expect(MIN_TARGET).toBe(DENSITY.smallButton)
    expect(MIN_TARGET).toBeGreaterThanOrEqual(24)
    expect(MIN_TARGET_CLASS).toBe('h-[24px] w-[24px]')
  })

  it('keeps every glyph smaller than the target that carries it', () => {
    for (const [token, size] of Object.entries(GLYPH)) {
      expect(size, token).toBeLessThanOrEqual(MIN_TARGET)
    }
  })

  it('gives the switch thumb a travel as wide as the thumb itself', () => {
    // 24 − 2 − 10 − 2. A travel shorter than the thumb reads as a nudge rather than as a throw.
    const travel = GLYPH.switchTrackWidth - 2 - GLYPH.switchThumb - 2

    expect(travel).toBe(GLYPH.switchThumb)
  })
})
