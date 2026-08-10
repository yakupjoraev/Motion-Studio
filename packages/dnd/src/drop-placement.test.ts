import { nodeId } from '@motion-studio/schema'
import type { Rect } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { LINE_THICKNESS_PX, type PlacementChild, placeInSlot } from './drop-placement'

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
