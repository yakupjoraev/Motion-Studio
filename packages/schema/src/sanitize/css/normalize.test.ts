import { describe, expect, it } from 'vitest'

import { VALID_CSS } from './__fixtures__/valid'
import { normalizeCssValue } from './normalize'

describe('spacing', () => {
  it('collapses runs of whitespace and trims the ends', () => {
    expect(normalizeCssValue('  rgb( 12   12  16 / 60% )  ')).toBe('rgb(12 12 16 / 60%)')
  })

  it('gives every comma exactly one space after it, whichever way it was written', () => {
    expect(normalizeCssValue('rgba(0,0,0,.4)')).toBe('rgba(0, 0, 0, .4)')
    expect(normalizeCssValue('rgba(0,  0 ,0, .4)')).toBe('rgba(0, 0, 0, .4)')
  })

  it('folds a value written across lines onto one', () => {
    expect(normalizeCssValue('0 1px 2px red,\n  0 8px 24px blue')).toBe(
      '0 1px 2px red, 0 8px 24px blue',
    )
  })

  it('leaves the inside of a quoted string alone', () => {
    expect(normalizeCssValue('"a   b"')).toBe('"a   b"')
  })
})

describe('case — ADR-269', () => {
  it('lowercases a function name', () => {
    expect(normalizeCssValue('LINEAR-Gradient(red, blue)')).toBe('linear-gradient(red, blue)')
  })

  it('lowercases a hex colour', () => {
    expect(normalizeCssValue('#FFA07A')).toBe('#ffa07a')
  })

  it('keeps a custom property name, which is case-sensitive', () => {
    expect(normalizeCssValue('var(--brandBlue)')).toBe('var(--brandBlue)')
  })

  it('keeps a font name, which the author chose and a reader reads', () => {
    expect(normalizeCssValue('Helvetica Neue, sans-serif')).toBe('Helvetica Neue, sans-serif')
  })

  it('keeps the colour notation the author chose', () => {
    expect(normalizeCssValue('oklch(62% 0.19 285)')).toBe('oklch(62% 0.19 285)')
  })
})

describe('url()', () => {
  it('copies the argument, where a comma and a semicolon are part of the token', () => {
    expect(normalizeCssValue('url(data:image/png;base64,iVBORw0KGgo=)')).toBe(
      'url(data:image/png;base64,iVBORw0KGgo=)',
    )
  })

  it('closes the gap a stray space left before the call', () => {
    expect(normalizeCssValue('URL ("a.png")')).toBe('url("a.png")')
  })
})

describe('idempotency', () => {
  it.each(VALID_CSS)('normalising $property twice changes nothing the second time', ({ value }) => {
    const once = normalizeCssValue(value)

    expect(normalizeCssValue(once)).toBe(once)
  })
})
