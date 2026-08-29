import { describe, expect, it } from 'vitest'

import {
  NAMED_CURVES,
  bezierPath,
  clampBezier,
  curveName,
  parseBezier,
  replaceBezier,
  toCssString,
} from './bezier'
import { durationOf } from './bezier-editor'

describe('clampBezier', () => {
  it('clamps x to the range CSS requires', () => {
    expect(clampBezier({ x1: -0.4, y1: 0, x2: 1.8, y2: 1 })).toEqual({
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
    })
  })

  it('leaves y alone, because overshoot is written there', () => {
    expect(clampBezier({ x1: 0.34, y1: -0.6, x2: 0.64, y2: 1.56 })).toEqual({
      x1: 0.34,
      y1: -0.6,
      x2: 0.64,
      y2: 1.56,
    })
  })

  it('keeps three decimals, so a drag does not step', () => {
    expect(clampBezier({ x1: 0.123456, y1: 0, x2: 1, y2: 1 }).x1).toBe(0.123)
  })
})

describe('parseBezier', () => {
  it('finds the curve inside a whole transition value', () => {
    expect(parseBezier('transform 600ms cubic-bezier(0.16, 1, 0.3, 1)')).toEqual({
      x1: 0.16,
      y1: 1,
      x2: 0.3,
      y2: 1,
    })
  })

  it('round-trips through toCssString', () => {
    const curve = { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 }

    expect(parseBezier(toCssString(curve))).toEqual(curve)
  })

  it('clamps an out-of-range x on the way in', () => {
    expect(parseBezier('cubic-bezier(1.4, 0, 0.2, 1)')?.x1).toBe(1)
  })

  it('has no answer for a value with no cubic-bezier in it', () => {
    expect(parseBezier('transform 700ms linear(0, 0.35 18%, 1)')).toBeUndefined()
    expect(parseBezier('cubic-bezier(0.1, 0.2)')).toBeUndefined()
    expect(parseBezier('cubic-bezier(a, b, c, d)')).toBeUndefined()
  })
})

describe('replaceBezier', () => {
  it('keeps the property and the duration around it', () => {
    expect(
      replaceBezier('transform 600ms cubic-bezier(0.16, 1, 0.3, 1)', {
        x1: 0.4,
        y1: 0,
        x2: 0.2,
        y2: 1,
      }),
    ).toBe('transform 600ms cubic-bezier(0.4, 0, 0.2, 1)')
  })

  it('appends a curve to a value that had none', () => {
    expect(replaceBezier('transform 600ms', { x1: 0.4, y1: 0, x2: 0.2, y2: 1 })).toBe(
      'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)',
    )
  })
})

describe('curveName', () => {
  it('names a curve that is one of the twelve', () => {
    const first = NAMED_CURVES[0]

    expect(first).toBeDefined()
    expect(first === undefined ? '' : curveName(first.curve)).toBe(first?.name)
  })

  it('calls anything else custom', () => {
    expect(curveName({ x1: 0.11, y1: 0.22, x2: 0.33, y2: 0.44 })).toBe('custom')
  })
})

describe('bezierPath', () => {
  it('draws from the bottom-left corner to the top-right one', () => {
    expect(bezierPath({ x1: 0, y1: 0, x2: 1, y2: 1 }, 100)).toBe('M 0 100 C 0 100, 100 0, 100 0')
  })
})

describe('durationOf', () => {
  it.each([
    ['transform 600ms cubic-bezier(0.4, 0, 0.2, 1)', 600],
    ['transform 1.2s ease', 1200],
    ['transform ease', 600],
  ])('reads %s as %i ms', (value, expected) => {
    expect(durationOf(value)).toBe(expected)
  })
})
