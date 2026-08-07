import { describe, expect, it } from 'vitest'

import { fromCss, toCss } from './font-css'

import type { FontValue } from './font-field.types'

const VALUES: readonly FontValue[] = [
  { family: 'var(--ms-font-sans)', size: 16, weight: 400, tracking: 0 },
  { family: 'Inter, sans-serif', size: 13, weight: 500, tracking: -0.01 },
  { family: 'var(--ms-font-mono)', size: 11.5, weight: 700, tracking: 0.08 },
]

describe('font CSS', () => {
  it('writes the four declarations the control edits', () => {
    expect(toCss(VALUES[0] as FontValue)).toBe(
      'font-family: var(--ms-font-sans); font-size: 16px; font-weight: 400; letter-spacing: 0em',
    )
  })

  it.each(VALUES)('round-trips %o through its own CSS', (value) => {
    expect(fromCss(toCss(value))).toEqual(value)
  })

  it('does not care what order the declarations arrive in', () => {
    expect(
      fromCss('letter-spacing: 0em; font-weight: 400; font-size: 16px; font-family: Inter'),
    ).toEqual({ family: 'Inter', size: 16, weight: 400, tracking: 0 })
  })

  it('tolerates a trailing semicolon and the whitespace a paste brings', () => {
    expect(
      fromCss('  font-family : Inter ;  font-size: 16px; font-weight:400;letter-spacing:0em;'),
    ).toEqual({ family: 'Inter', size: 16, weight: 400, tracking: 0 })
  })

  it.each([
    '',
    'font-family: Inter',
    'font-size: 16px; font-weight: 400; letter-spacing: 0em',
    'font-family: Inter; font-size: large; font-weight: 400; letter-spacing: 0em',
    'font-family: Inter; font-size: 16px; font-weight: bold; letter-spacing: 0em',
  ])('reports %s rather than guessing at it', (input) => {
    expect(fromCss(input)).toBeNull()
  })
})
