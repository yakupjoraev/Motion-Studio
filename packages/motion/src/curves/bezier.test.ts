import { describe, expect, it } from 'vitest'

import { cubicBezier, fromCssString, toCssString } from './bezier'
import { EASINGS, EASING_NAMES } from './easings'

/** The CSS `ease-in-out`, whose curve is symmetric about the diagonal. */
const EASE_IN_OUT = [0.42, 0, 0.58, 1] as const

describe('cubicBezier', () => {
  it('is the identity at both ends and outside them', () => {
    expect(cubicBezier(EASINGS.standard, 0)).toBe(0)
    expect(cubicBezier(EASINGS.standard, 1)).toBe(1)
    expect(cubicBezier(EASINGS.standard, -0.5)).toBe(0)
    expect(cubicBezier(EASINGS.standard, 2)).toBe(1)
  })

  it('passes through the middle of a symmetric curve', () => {
    expect(cubicBezier(EASE_IN_OUT, 0.5)).toBeCloseTo(0.5, 5)
  })

  it('returns the input for `linear`, which is what a straight line means', () => {
    for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      expect(cubicBezier(EASINGS.linear, t)).toBeCloseTo(t, 6)
    }
  })

  it('decelerates: it is ahead of linear early and level with it at the end', () => {
    expect(cubicBezier(EASINGS.decelerate, 0.25)).toBeGreaterThan(0.25)
    expect(cubicBezier(EASINGS.decelerate, 0.9)).toBeGreaterThan(0.9)
  })

  it('accelerates: it is behind linear early', () => {
    expect(cubicBezier(EASINGS.accelerate, 0.25)).toBeLessThan(0.25)
  })

  it('overshoots past 1 where the curve says it should', () => {
    const peak = Math.max(
      ...Array.from({ length: 99 }, (_, index) =>
        cubicBezier(EASINGS.overshoot, (index + 1) / 100),
      ),
    )

    expect(peak).toBeGreaterThan(1)
  })

  it('solves the flat start of `expoOut`, where Newton has no slope to follow', () => {
    // 0 → 1 monotonically, which is the property the bisection fallback has to preserve.
    let previous = 0

    for (let index = 1; index <= 100; index += 1) {
      const value = cubicBezier(EASINGS.expoOut, index / 100)

      expect(value).toBeGreaterThanOrEqual(previous - 1e-6)
      previous = value
    }

    expect(previous).toBeCloseTo(1, 6)
  })
})

describe('toCssString', () => {
  it('prints the CSS form without float noise', () => {
    expect(toCssString(EASINGS.standard)).toBe('cubic-bezier(0.2, 0, 0, 1)')
    expect(toCssString(EASINGS.bounce)).toBe('cubic-bezier(0.68, -0.55, 0.27, 1.55)')
  })

  it('round-trips every named curve through the parser', () => {
    for (const name of EASING_NAMES) {
      expect(fromCssString(toCssString(EASINGS[name]))).toEqual(EASINGS[name])
    }
  })
})

describe('fromCssString', () => {
  it('accepts whitespace and rejects anything that is not four numbers', () => {
    expect(fromCssString('  cubic-bezier( 0 , 0 , 1 , 1 ) ')).toEqual([0, 0, 1, 1])
    expect(fromCssString('ease-in-out')).toBeNull()
    expect(fromCssString('cubic-bezier(0, 0, 1)')).toBeNull()
    expect(fromCssString('cubic-bezier(0, 0, 1, banana)')).toBeNull()
  })
})
