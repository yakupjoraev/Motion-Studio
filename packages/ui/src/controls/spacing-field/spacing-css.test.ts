import { describe, expect, it } from 'vitest'

import { fromCss, toCss } from './spacing-css'

import type { SpacingValue } from './spacing-field.types'

const VALUES: readonly SpacingValue[] = [
  { top: 0, right: 0, bottom: 0, left: 0 },
  { top: 8, right: 8, bottom: 8, left: 8 },
  { top: 4, right: 12, bottom: 4, left: 12 },
  { top: 1, right: 2, bottom: 3, left: 4 },
  { top: 0.5, right: 1.5, bottom: 0, left: 24 },
]

describe('spacing CSS', () => {
  it('always writes the four-value form, because the shorthand collapses lossily', () => {
    expect(toCss({ top: 8, right: 8, bottom: 8, left: 8 })).toBe('8px 8px 8px 8px')
  })

  it('writes the unit it is given', () => {
    expect(toCss({ top: 1, right: 2, bottom: 3, left: 4 }, 'rem')).toBe('1rem 2rem 3rem 4rem')
  })

  it.each(VALUES)('round-trips %o through its own CSS', (value) => {
    expect(fromCss(toCss(value))).toEqual(value)
  })

  it.each([
    ['8px', { top: 8, right: 8, bottom: 8, left: 8 }],
    ['4px 12px', { top: 4, right: 12, bottom: 4, left: 12 }],
    ['4px 12px 8px', { top: 4, right: 12, bottom: 8, left: 12 }],
    ['1px 2px 3px 4px', { top: 1, right: 2, bottom: 3, left: 4 }],
  ])('reads the shorthand %s', (input, expected) => {
    expect(fromCss(input)).toEqual(expected)
  })

  it('tolerates the whitespace a paste brings', () => {
    expect(fromCss('  4px   12px  ')).toEqual({ top: 4, right: 12, bottom: 4, left: 12 })
  })

  it.each(['', 'auto', '1px 2px 3px 4px 5px', 'thin dotted', '1px auto'])(
    'reports %s rather than guessing at it',
    (input) => {
      expect(fromCss(input)).toBeNull()
    },
  )
})
