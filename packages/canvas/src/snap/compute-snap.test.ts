import { describe, expect, it } from 'vitest'

import { box, rect } from '../test/snap'

import { computeSnap } from './compute-snap'
import { generateSnapCandidates } from './generate-candidates'
import { THRESHOLD_PX } from './snap.constants'
import type { SnapCandidate } from './snap.types'

const edge = (
  axis: 'x' | 'y',
  value: number,
  extent: readonly [number, number] = [0, 100],
): SnapCandidate => ({
  axis,
  kind: 'edge',
  value,
  from: extent[0],
  to: extent[1],
})

/** The threshold as the caller computes it: 4 screen px at this zoom, in canvas units. */
const at = (zoom: number): number => THRESHOLD_PX / zoom

describe('computeSnap', () => {
  it('returns a zero delta and no guides when nothing is in range', () => {
    const result = computeSnap(rect(0, 0, 100, 100), [edge('x', 400)], at(1))

    expect(result.delta).toEqual({ x: 0, y: 0 })
    expect(result.guides).toEqual([])
  })

  it('draws a guide for an alignment that is already exact, where the delta is zero', () => {
    const result = computeSnap(rect(0, 0, 100, 100), [edge('x', 50)], at(1))

    expect(result.delta).toEqual({ x: 0, y: 0 })
    expect(result.guides).toHaveLength(1)
  })

  it('snaps one axis and leaves the other alone', () => {
    const result = computeSnap(rect(97, 40, 100, 100), [edge('x', 100), edge('y', 400)], at(1))

    expect(result.delta).toEqual({ x: 3, y: 0 })
    expect(result.guides).toHaveLength(1)
    expect(result.guides[0]?.axis).toBe('x')
  })

  it('snaps both axes independently', () => {
    const result = computeSnap(rect(97, 43, 100, 100), [edge('x', 100), edge('y', 40)], at(1))

    expect(result.delta).toEqual({ x: 3, y: -3 })
    expect(result.guides.map((guide) => guide.axis)).toEqual(['x', 'y'])
  })

  it('takes the nearest of two candidates in range', () => {
    const result = computeSnap(rect(100, 0, 100, 100), [edge('x', 102), edge('x', 103)], at(1))

    expect(result.delta.x).toBe(2)
  })

  it('breaks a tie by priority, not by order', () => {
    const grid: SnapCandidate = { axis: 'x', kind: 'grid', value: 98 }
    const guide: SnapCandidate = { axis: 'x', kind: 'guide', value: 102 }

    expect(computeSnap(rect(100, 0, 100, 100), [grid, guide], at(1)).delta.x).toBe(2)
    expect(computeSnap(rect(100, 0, 100, 100), [guide, grid], at(1)).delta.x).toBe(2)
  })

  it('snaps exactly at the threshold and not one unit beyond it', () => {
    expect(computeSnap(rect(96, 0, 100, 100), [edge('x', 100)], at(1)).delta.x).toBe(4)
    expect(computeSnap(rect(95, 0, 100, 100), [edge('x', 100)], at(1)).delta.x).toBe(0)
  })

  it('engages at the same screen distance at every zoom level', () => {
    const candidates = [edge('x', 100)]

    for (const zoom of [0.25, 1, 4]) {
      // 4 screen px away from the candidate, expressed in canvas units at this zoom.
      const near = 100 - THRESHOLD_PX / zoom
      const far = 100 - (THRESHOLD_PX + 1) / zoom

      expect(computeSnap(rect(near, 0, 100, 100), candidates, at(zoom)).delta.x).toBeCloseTo(
        THRESHOLD_PX / zoom,
        6,
      )
      expect(computeSnap(rect(far, 0, 100, 100), candidates, at(zoom)).delta.x).toBe(0)
    }
  })

  it('spans the guide across everything sharing the matched coordinate', () => {
    const result = computeSnap(
      rect(98, 200, 50, 50),
      [edge('x', 100, [0, 60]), edge('x', 100, [300, 400]), edge('x', 100, [90, 120])],
      at(1),
    )

    expect(result.guides[0]?.from).toBe(0)
    expect(result.guides[0]?.to).toBe(400)
  })

  it('bounds the guide by the moving box when the candidate carries no extent', () => {
    const result = computeSnap(
      rect(98, 200, 50, 50),
      [{ axis: 'x', kind: 'grid', value: 100 }],
      at(1),
    )

    expect([result.guides[0]?.from, result.guides[0]?.to]).toEqual([200, 250])
  })

  describe('equal spacing', () => {
    const siblings = [box('a', 0, 0, 100, 60), box('b', 200, 0, 100, 60), box('c', 400, 0, 100, 60)]
    const moving = rect(122, 0, 60, 60)
    const candidates = generateSnapCandidates({ moving, siblings })

    it('snaps to the position that equalises the two gaps', () => {
      const result = computeSnap(moving, candidates, at(1))

      // The opening is 100 → 200; a 60-wide box centred in it starts at 120, so both gaps are 20.
      expect(result.delta.x).toBe(-2)
    })

    it('reports both gaps, measured off where the box landed', () => {
      const guide = computeSnap(moving, candidates, at(1)).guides[0]

      expect(guide?.gaps.map((gap) => gap.distance)).toEqual([20, 20])
      expect(guide?.gaps.map((gap) => [gap.start, gap.end])).toEqual([
        [100, 120],
        [180, 200],
      ])
      expect(guide?.gaps.every((gap) => gap.cross === 30)).toBe(true)
    })

    it('never matches a spacing value with the centre or the trailing edge', () => {
      // This box's centre is two units off 120, the equalising position for the *leading* edge. Were
      // the restriction missing, the centre would snap there and the two gaps would come out 50/-10.
      const centred = rect(88, 0, 60, 60)

      expect(computeSnap(centred, candidates, at(1)).delta.x).toBe(0)
    })
  })

  describe('multi-selection', () => {
    it('moves the bounding box, so the members keep their relative positions', () => {
      const members = [rect(98, 0, 40, 40), rect(158, 20, 40, 40), rect(98, 80, 40, 40)]
      const bounds = rect(98, 0, 100, 120)
      const result = computeSnap(bounds, [edge('x', 100), edge('y', 2)], at(1))

      const moved = members.map((member) => ({
        x: member.x + result.delta.x,
        y: member.y + result.delta.y,
      }))

      expect(result.delta).toEqual({ x: 2, y: 2 })
      expect(moved).toEqual([
        { x: 100, y: 2 },
        { x: 160, y: 22 },
        { x: 100, y: 82 },
      ])
    })
  })

  it('snaps nothing when the threshold is zero, which is what a held Cmd comes to', () => {
    expect(computeSnap(rect(99, 0, 10, 10), [edge('x', 100)], 0)).toEqual({
      delta: { x: 0, y: 0 },
      guides: [],
    })
  })
})
