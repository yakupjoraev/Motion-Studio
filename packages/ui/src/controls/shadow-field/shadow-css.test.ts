import { describe, expect, it } from 'vitest'

import { fromCss, toCss } from './shadow-css'

import type { ShadowLayer } from './shadow-field.types'

const CONTACT: ShadowLayer = {
  x: 0,
  y: 2,
  blur: 4,
  spread: 0,
  color: 'oklch(0% 0 0 / 0.06)',
  inset: false,
}

const AMBIENT: ShadowLayer = {
  x: 0,
  y: 4,
  blur: 8,
  spread: -2,
  color: 'oklch(0% 0 0 / 0.1)',
  inset: false,
}

const HIGHLIGHT: ShadowLayer = {
  x: 0,
  y: 1,
  blur: 0,
  spread: 0,
  color: 'oklch(100% 0 0 / 0.06)',
  inset: true,
}

describe('shadow CSS', () => {
  it('writes four lengths and a colour per layer', () => {
    expect(toCss([CONTACT])).toBe('0px 2px 4px 0px oklch(0% 0 0 / 0.06)')
  })

  it('puts inset first, which is where CSS reads it', () => {
    expect(toCss([HIGHLIGHT])).toBe('inset 0px 1px 0px 0px oklch(100% 0 0 / 0.06)')
  })

  it('separates layers with commas', () => {
    expect(toCss([CONTACT, AMBIENT]).split('), ')).toHaveLength(2)
  })

  it('calls an empty stack none, which is what CSS calls no shadow', () => {
    expect(toCss([])).toBe('none')
  })

  it.each([
    ['one layer', [CONTACT]],
    ['a layered set', [CONTACT, AMBIENT]],
    ['an inset highlight', [HIGHLIGHT]],
    ['a mixed stack', [CONTACT, HIGHLIGHT, AMBIENT]],
    ['an empty stack', []],
  ])('round-trips %s through its own CSS', (_name, layers) => {
    expect(fromCss(toCss(layers))).toEqual(layers)
  })

  it('does not split a colour that contains commas of its own', () => {
    const glow: ShadowLayer = {
      x: 0,
      y: 0,
      blur: 16,
      spread: 0,
      color: 'color-mix(in oklab, var(--ms-color-accent) 10%, transparent)',
      inset: false,
    }

    expect(fromCss(toCss([glow]))).toEqual([glow])
  })

  it('keeps negative lengths, which is what a tightened spread is', () => {
    expect(fromCss('0px 4px 8px -2px oklch(0% 0 0 / 0.1)')).toEqual([AMBIENT])
  })

  it('tolerates the whitespace a paste brings', () => {
    expect(fromCss('  0px   2px  4px 0px   oklch(0% 0 0 / 0.06)  ')).toEqual([CONTACT])
  })

  it.each([
    '',
    '0 2px 4px oklch(0% 0 0 / 0.06)',
    '0px 2px oklch(0% 0 0)',
    '0px 2px 4px 0px',
    '0px 2px 4px 0px 8px oklch(0% 0 0)',
    '2px 2px 2px 2px red, none',
  ])('reports %s rather than guessing at it', (input) => {
    expect(fromCss(input)).toBeNull()
  })
})
