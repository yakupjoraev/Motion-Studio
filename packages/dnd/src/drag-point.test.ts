import { describe, expect, it } from 'vitest'

import { centre, contains, dragPoint, edgeRect } from './drag-point'

const box = { left: 100, top: 50, width: 200, height: 100 }

describe('dragPoint', () => {
  it('is the cursor when there is one', () => {
    expect(dragPoint({ x: 12, y: 34 }, box)).toEqual({ x: 12, y: 34 })
  })

  it('is the centre of the dragged box for a keyboard drag', () => {
    expect(dragPoint(null, box)).toEqual({ x: 200, y: 100 })
  })

  it('is nothing before anything has been measured', () => {
    expect(dragPoint(null, null)).toBeNull()
  })
})

describe('contains', () => {
  it.each([
    ['inside', { x: 150, y: 75 }, true],
    ['on the left edge', { x: 100, y: 75 }, true],
    ['on the bottom edge', { x: 150, y: 150 }, true],
    ['left of the box', { x: 99, y: 75 }, false],
    ['below the box', { x: 150, y: 151 }, false],
  ])('reports a point %s', (_, point, expected) => {
    expect(contains(box, point)).toBe(expected)
  })
})

describe('edgeRect', () => {
  it('turns the cache’s origin and size into edges', () => {
    expect(edgeRect({ x: 10, y: 20, width: 30, height: 40 })).toEqual({
      left: 10,
      top: 20,
      width: 30,
      height: 40,
    })
  })
})

describe('centre', () => {
  it('is the middle of the box', () => {
    expect(centre(box)).toEqual({ x: 200, y: 100 })
  })
})
