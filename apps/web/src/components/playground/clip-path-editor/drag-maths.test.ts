import { describe, expect, it } from 'vitest'

import { nudgeVertex, pointerToVertex } from './drag-maths'

const BOX = { width: 400, height: 200 }

describe('pointerToVertex', () => {
  it('turns a pointer offset into a percentage of the target', () => {
    expect(pointerToVertex({ x: 40, y: 50 }, BOX, '%')).toEqual({ x: 10, y: 25 })
  })

  it('reads the same drag as pixels when the shape is in pixels', () => {
    expect(pointerToVertex({ x: 40, y: 50 }, BOX, 'px')).toEqual({ x: 40, y: 50 })
  })

  it('keeps a vertex inside the box the reader can see', () => {
    expect(pointerToVertex({ x: -80, y: 900 }, BOX, '%')).toEqual({ x: 0, y: 100 })
    expect(pointerToVertex({ x: -80, y: 900 }, BOX, 'px')).toEqual({ x: 0, y: 200 })
  })

  it('answers zero rather than dividing by a target with no width', () => {
    expect(pointerToVertex({ x: 40, y: 50 }, { width: 0, height: 0 }, '%')).toEqual({ x: 0, y: 0 })
  })
})

describe('nudgeVertex', () => {
  it('steps in the shape’s own unit', () => {
    expect(nudgeVertex({ x: 50, y: 50 }, 5, -1, BOX, '%')).toEqual({ x: 55, y: 49 })
  })

  it('clamps to 100 in percent and to the box in pixels', () => {
    expect(nudgeVertex({ x: 98, y: 0 }, 5, -5, BOX, '%')).toEqual({ x: 100, y: 0 })
    expect(nudgeVertex({ x: 398, y: 0 }, 5, 0, BOX, 'px')).toEqual({ x: 400, y: 0 })
  })
})
