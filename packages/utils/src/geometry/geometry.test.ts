import { describe, expect, it } from 'vitest'

import { type Rect, center, contains, expand, intersects, union } from './geometry'

const rect = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
})

describe('intersects', () => {
  it('is true for overlapping rects', () => {
    expect(intersects(rect(0, 0, 10, 10), rect(5, 5, 10, 10))).toBe(true)
  })

  it('is false for separated rects', () => {
    expect(intersects(rect(0, 0, 10, 10), rect(20, 20, 5, 5))).toBe(false)
  })

  it('is false for rects that only touch, so adjacent siblings do not intersect', () => {
    expect(intersects(rect(0, 0, 10, 10), rect(10, 0, 10, 10))).toBe(false)
    expect(intersects(rect(0, 0, 10, 10), rect(0, 10, 10, 10))).toBe(false)
  })

  it('is true when one rect contains the other', () => {
    expect(intersects(rect(0, 0, 100, 100), rect(10, 10, 5, 5))).toBe(true)
  })

  it('is symmetric in its arguments', () => {
    const a = rect(0, 0, 10, 10)
    const b = rect(5, 5, 10, 10)

    expect(intersects(a, b)).toBe(intersects(b, a))
  })

  it('separates on one axis alone', () => {
    expect(intersects(rect(0, 0, 10, 10), rect(5, 20, 10, 10))).toBe(false)
    expect(intersects(rect(0, 0, 10, 10), rect(20, 5, 10, 10))).toBe(false)
  })

  it('treats a zero-size rect as a point: strictly inside intersects', () => {
    expect(intersects(rect(0, 0, 10, 10), rect(5, 5, 0, 0))).toBe(true)
  })

  it('treats a zero-size rect on the boundary as not intersecting', () => {
    expect(intersects(rect(0, 0, 10, 10), rect(0, 5, 0, 0))).toBe(false)
    expect(intersects(rect(0, 0, 10, 10), rect(10, 5, 0, 0))).toBe(false)
  })
})

describe('contains', () => {
  it('is true when the inner rect lies wholly inside', () => {
    expect(contains(rect(0, 0, 100, 100), rect(10, 10, 20, 20))).toBe(true)
  })

  it('is true for a rect containing itself', () => {
    const r = rect(3, 4, 10, 10)

    expect(contains(r, r)).toBe(true)
  })

  it('is true when the inner rect shares an edge', () => {
    expect(contains(rect(0, 0, 100, 100), rect(0, 0, 100, 50))).toBe(true)
  })

  it('is false when the inner rect crosses an edge', () => {
    expect(contains(rect(0, 0, 100, 100), rect(90, 10, 20, 20))).toBe(false)
    expect(contains(rect(0, 0, 100, 100), rect(10, 90, 20, 20))).toBe(false)
    expect(contains(rect(0, 0, 100, 100), rect(-1, 10, 20, 20))).toBe(false)
    expect(contains(rect(0, 0, 100, 100), rect(10, -1, 20, 20))).toBe(false)
  })

  it('is not symmetric: the larger rect does not fit inside the smaller one', () => {
    expect(contains(rect(10, 10, 5, 5), rect(0, 0, 100, 100))).toBe(false)
  })
})

describe('union', () => {
  it('covers both rects', () => {
    expect(union(rect(0, 0, 10, 10), rect(20, 30, 10, 10))).toEqual(rect(0, 0, 30, 40))
  })

  it('returns an equal rect when both inputs are the same', () => {
    expect(union(rect(5, 5, 10, 10), rect(5, 5, 10, 10))).toEqual(rect(5, 5, 10, 10))
  })

  it('returns the outer rect when one contains the other', () => {
    expect(union(rect(0, 0, 100, 100), rect(10, 10, 5, 5))).toEqual(rect(0, 0, 100, 100))
  })

  it('handles negative coordinates', () => {
    expect(union(rect(-20, -10, 10, 10), rect(0, 0, 5, 5))).toEqual(rect(-20, -10, 25, 15))
  })

  it('is symmetric in its arguments', () => {
    const a = rect(0, 0, 10, 10)
    const b = rect(20, 30, 10, 10)

    expect(union(a, b)).toEqual(union(b, a))
  })
})

describe('center', () => {
  it('returns the midpoint', () => {
    expect(center(rect(0, 0, 10, 20))).toEqual({ x: 5, y: 10 })
  })

  it('offsets by the rect origin', () => {
    expect(center(rect(10, 10, 10, 10))).toEqual({ x: 15, y: 15 })
  })

  it('returns the origin for a zero-size rect', () => {
    expect(center(rect(7, 8, 0, 0))).toEqual({ x: 7, y: 8 })
  })

  it('produces fractional coordinates for an odd size', () => {
    expect(center(rect(0, 0, 3, 3))).toEqual({ x: 1.5, y: 1.5 })
  })
})

describe('expand', () => {
  it('grows on every side, so each dimension gains twice the amount', () => {
    expect(expand(rect(10, 10, 20, 20), 5)).toEqual(rect(5, 5, 30, 30))
  })

  it('shrinks on a negative amount', () => {
    expect(expand(rect(10, 10, 20, 20), -5)).toEqual(rect(15, 15, 10, 10))
  })

  it('returns an equal rect for an amount of 0', () => {
    expect(expand(rect(1, 2, 3, 4), 0)).toEqual(rect(1, 2, 3, 4))
  })

  it('does not clamp a shrink past the rect size', () => {
    expect(expand(rect(0, 0, 10, 10), -10)).toEqual(rect(10, 10, -10, -10))
  })

  it('produces a rect that contains the original', () => {
    const original = rect(10, 10, 20, 20)

    expect(contains(expand(original, 4), original)).toBe(true)
  })
})
