import { describe, expect, it } from 'vitest'

import { approxEqual, clamp, inverseLerp, lerp, round, snapTo } from './math'

describe('clamp', () => {
  it('returns the value when it is inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('returns the minimum when the value is below it', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
  })

  it('returns the maximum when the value is above it', () => {
    expect(clamp(42, 0, 10)).toBe(10)
  })

  it('includes both bounds', () => {
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })

  it('returns the bound when the range is a single point', () => {
    expect(clamp(5, 3, 3)).toBe(3)
  })
})

describe('lerp', () => {
  it('returns the start at t = 0 and the end at t = 1', () => {
    expect(lerp(10, 20, 0)).toBe(10)
    expect(lerp(10, 20, 1)).toBe(20)
  })

  it('interpolates in between', () => {
    expect(lerp(10, 20, 0.5)).toBe(15)
  })

  it('extrapolates beyond the range, because t is not clamped', () => {
    expect(lerp(10, 20, 2)).toBe(30)
    expect(lerp(10, 20, -1)).toBe(0)
  })

  it('interpolates downward when the end is below the start', () => {
    expect(lerp(20, 10, 0.25)).toBe(17.5)
  })
})

describe('inverseLerp', () => {
  it('returns 0 at the start and 1 at the end', () => {
    expect(inverseLerp(10, 20, 10)).toBe(0)
    expect(inverseLerp(10, 20, 20)).toBe(1)
  })

  it('returns the fraction in between', () => {
    expect(inverseLerp(10, 20, 15)).toBe(0.5)
  })

  it('returns a value outside 0-1 for a value outside the range', () => {
    expect(inverseLerp(10, 20, 30)).toBe(2)
    expect(inverseLerp(10, 20, 0)).toBe(-1)
  })

  it('returns 0 for a zero-length range instead of dividing by zero', () => {
    expect(inverseLerp(5, 5, 5)).toBe(0)
    expect(inverseLerp(5, 5, 99)).toBe(0)
  })

  it('round-trips with lerp', () => {
    expect(lerp(10, 20, inverseLerp(10, 20, 13))).toBe(13)
  })
})

describe('round', () => {
  it('rounds to a whole number by default', () => {
    expect(round(1.4)).toBe(1)
    expect(round(1.5)).toBe(2)
  })

  it('rounds to the requested precision', () => {
    expect(round(1.2345, 2)).toBe(1.23)
    expect(round(1.2355, 2)).toBe(1.24)
  })

  it('rounds halves away from zero in both directions', () => {
    expect(round(0.5)).toBe(1)
    expect(round(-0.5)).toBe(-1)
    expect(round(-1.5)).toBe(-2)
  })

  it('leaves an already-rounded value alone', () => {
    expect(round(3, 2)).toBe(3)
  })

  it('handles negative precision by rounding to tens', () => {
    expect(round(1234, -2)).toBe(1200)
  })
})

describe('snapTo', () => {
  it('snaps to the nearest multiple', () => {
    expect(snapTo(7, 5)).toBe(5)
    expect(snapTo(8, 5)).toBe(10)
  })

  it('leaves an exact multiple alone', () => {
    expect(snapTo(20, 4)).toBe(20)
  })

  it('snaps negative values', () => {
    expect(snapTo(-7, 5)).toBe(-5)
  })

  it('returns the value untouched for a step of 0', () => {
    expect(snapTo(7.3, 0)).toBe(7.3)
  })

  it('snaps to a fractional step', () => {
    expect(snapTo(0.34, 0.25)).toBe(0.25)
  })
})

describe('approxEqual', () => {
  it('is true for values within the default tolerance', () => {
    expect(approxEqual(0.1 + 0.2, 0.3)).toBe(true)
  })

  it('is false for values outside the default tolerance', () => {
    expect(approxEqual(1, 1.001)).toBe(false)
  })

  it('is true for identical values', () => {
    expect(approxEqual(2.5, 2.5)).toBe(true)
  })

  it('treats the tolerance as inclusive', () => {
    expect(approxEqual(1, 1.5, 0.5)).toBe(true)
  })

  it('honours a caller-supplied tolerance', () => {
    expect(approxEqual(1, 1.4, 0.5)).toBe(true)
    expect(approxEqual(1, 1.6, 0.5)).toBe(false)
  })

  it('is symmetric in its arguments', () => {
    expect(approxEqual(1.6, 1, 0.5)).toBe(approxEqual(1, 1.6, 0.5))
  })
})
