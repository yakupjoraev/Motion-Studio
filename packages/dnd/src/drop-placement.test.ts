import { nodeId } from '@motion-studio/schema'
import type { Rect } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import {
  LINE_THICKNESS_PX,
  type PlacementChild,
  placeInSlot,
  pointForPosition,
} from './drop-placement'

const rect = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
})

const child = (name: string, box: Rect): PlacementChild => ({
  id: nodeId(`node_${name}`),
  rect: box,
})

const CONTAINER = rect(0, 0, 400, 300)

const column = [
  child('a', rect(0, 0, 400, 100)),
  child('b', rect(0, 100, 400, 100)),
  child('c', rect(0, 200, 400, 100)),
]

describe('placeInSlot', () => {
  it('fills a container with no children', () => {
    const placement = placeInSlot({
      orientation: 'vertical',
      point: { x: 10, y: 10 },
      container: CONTAINER,
      children: [],
    })

    expect(placement).toEqual({ position: 0, indicator: { kind: 'fill', rect: CONTAINER } })
  })

  it('draws a hairline, not a band', () => {
    const placement = placeInSlot({
      orientation: 'vertical',
      point: { x: 10, y: 160 },
      container: CONTAINER,
      children: column,
    })

    expect(placement.indicator.rect.height).toBe(LINE_THICKNESS_PX)
  })

  it('centres the line on the edge it marks', () => {
    const placement = placeInSlot({
      orientation: 'vertical',
      point: { x: 10, y: 10 },
      container: CONTAINER,
      children: column,
    })

    // Above everything: the line straddles the first child's top edge.
    expect(placement.indicator.rect.y).toBe(-1)
  })

  it('takes the horizontal axis from the orientation, not from the rects', () => {
    const row = [child('a', rect(0, 0, 100, 100)), child('b', rect(100, 0, 100, 100))]
    const placement = placeInSlot({
      orientation: 'horizontal',
      point: { x: 160, y: 50 },
      container: rect(0, 0, 200, 100),
      children: row,
    })

    expect(placement).toEqual({
      position: 2,
      indicator: { kind: 'line', axis: 'x', rect: { x: 199, y: 0, width: 2, height: 100 } },
    })
  })

  describe('in a grid', () => {
    const container = rect(0, 0, 220, 220)
    const cells = [
      child('a', rect(0, 0, 100, 100)),
      child('b', rect(120, 0, 100, 100)),
      child('c', rect(0, 120, 100, 100)),
    ]

    const at = (x: number, y: number) =>
      placeInSlot({ orientation: 'grid', point: { x, y }, container, children: cells })

    it('reads a row at a time', () => {
      expect(at(20, 40).position).toBe(0)
      expect(at(80, 40).position).toBe(1)
      expect(at(160, 40).position).toBe(1)
      expect(at(200, 40).position).toBe(2)
    })

    it('puts the empty cell after the last child', () => {
      const placement = at(160, 160)

      expect(placement.position).toBe(3)
      expect(placement.indicator).toEqual({
        kind: 'cell',
        rect: { x: 120, y: 120, width: 100, height: 100 },
      })
    })

    it('wraps to the next row when the container has no room to the right', () => {
      const narrow = rect(0, 0, 100, 400)
      const stacked = [child('a', rect(0, 0, 100, 100)), child('b', rect(0, 120, 100, 100))]
      const placement = placeInSlot({
        orientation: 'grid',
        point: { x: 50, y: 300 },
        container: narrow,
        children: stacked,
      })

      expect(placement.indicator.rect).toEqual({ x: 0, y: 240, width: 100, height: 100 })
    })

    it('has no gap to measure when a single child sits alone', () => {
      const placement = placeInSlot({
        orientation: 'grid',
        point: { x: 190, y: 50 },
        container,
        children: [child('a', rect(0, 0, 100, 100))],
      })

      expect(placement.indicator.rect).toEqual({ x: 100, y: 0, width: 100, height: 100 })
    })
  })
})

describe('pointForPosition', () => {
  /**
   * The one property worth asserting: a point this function returns is a point `placeInSlot` reads
   * back as the position it was asked for. Anything else is an implementation detail of the midpoint
   * comparison, and a keyboard step is only correct if the two agree.
   */
  const readsBackAs = (
    orientation: 'vertical' | 'horizontal' | 'grid',
    children: readonly PlacementChild[],
    container: Rect,
    position: number,
  ): number | null => {
    const point = pointForPosition({ orientation, position, point: { x: 10, y: 10 }, children })

    return point === null ? null : placeInSlot({ orientation, point, container, children }).position
  }

  it('reads back as every position in a column', () => {
    expect([0, 1, 2, 3].map((p) => readsBackAs('vertical', column, CONTAINER, p))).toEqual([
      0, 1, 2, 3,
    ])
  })

  it('reads back as every position in a row', () => {
    const row = [child('a', rect(0, 0, 100, 100)), child('b', rect(100, 0, 100, 100))]

    expect([0, 1, 2].map((p) => readsBackAs('horizontal', row, rect(0, 0, 200, 100), p))).toEqual([
      0, 1, 2,
    ])
  })

  it('reads back as every position in a grid', () => {
    const cells = [
      child('a', rect(0, 0, 100, 100)),
      child('b', rect(120, 0, 100, 100)),
      child('c', rect(0, 120, 100, 100)),
    ]

    expect([0, 1, 2, 3].map((p) => readsBackAs('grid', cells, rect(0, 0, 220, 220), p))).toEqual([
      0, 1, 2, 3,
    ])
  })

  it('has no point for a position the list does not have', () => {
    expect(
      pointForPosition({
        orientation: 'vertical',
        position: -1,
        point: { x: 0, y: 0 },
        children: column,
      }),
    ).toBeNull()
    expect(
      pointForPosition({
        orientation: 'vertical',
        position: 4,
        point: { x: 0, y: 0 },
        children: column,
      }),
    ).toBeNull()
  })

  it('leaves the cross axis where the drag already is', () => {
    const point = pointForPosition({
      orientation: 'vertical',
      position: 1,
      point: { x: 137, y: 0 },
      children: column,
    })

    expect(point?.x).toBe(137)
  })

  it('fills an empty slot at its only position', () => {
    const point = pointForPosition({
      orientation: 'vertical',
      position: 0,
      point: { x: 5, y: 5 },
      children: [],
    })

    expect(point).toEqual({ x: 5, y: 5 })
  })
})
