import { describe, expect, it } from 'vitest'

import { fromCss, toCss } from './radius-css'

import type { RadiusValue } from './radius-field.types'

const VALUES: readonly RadiusValue[] = [
  { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
  { topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 },
  { topLeft: 8, topRight: 0, bottomRight: 8, bottomLeft: 0 },
  { topLeft: 1, topRight: 2, bottomRight: 3, bottomLeft: 4 },
  { topLeft: 999, topRight: 0.5, bottomRight: 12, bottomLeft: 2 },
]

describe('radius CSS', () => {
  it('writes the corners in the order the shorthand reads them', () => {
    expect(toCss({ topLeft: 1, topRight: 2, bottomRight: 3, bottomLeft: 4 })).toBe(
      '1px 2px 3px 4px',
    )
  })

  it.each(VALUES)('round-trips %o through its own CSS', (value) => {
    expect(fromCss(toCss(value))).toEqual(value)
  })

  it.each([
    ['4px', { topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 }],
    ['8px 0px', { topLeft: 8, topRight: 0, bottomRight: 8, bottomLeft: 0 }],
    ['8px 4px 0px', { topLeft: 8, topRight: 4, bottomRight: 0, bottomLeft: 4 }],
  ])('reads the shorthand %s', (input, expected) => {
    expect(fromCss(input)).toEqual(expected)
  })

  it.each(['', 'inherit', 'unset', '1px 2px 3px 4px 5px'])(
    'reports %s rather than guessing',
    (input) => {
      expect(fromCss(input)).toBeNull()
    },
  )
})
