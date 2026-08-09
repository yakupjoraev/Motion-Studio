import { describe, expect, it } from 'vitest'

import { box, rect, valuesOf } from '../test/snap'

import { generateSnapCandidates } from './generate-candidates'

/**
 * Three siblings in a row, 100 wide and 60 tall, with 40 of air between them, inside a 600 × 200
 * container. The moving box is the same size as a sibling and starts clear of all of them.
 */
const layout = {
  moving: rect(500, 300, 100, 60),
  siblings: [box('a', 0, 20, 100, 60), box('b', 140, 20, 100, 60), box('c', 280, 20, 100, 60)],
  container: rect(0, 0, 600, 200),
  guides: [{ id: 'g1', axis: 'x' as const, value: 250 }],
  gridSize: 8,
}

describe('generateSnapCandidates', () => {
  it('puts every moving edge and centre on the nearest grid multiple', () => {
    const candidates = generateSnapCandidates(layout)

    // x edges are 500 / 550 / 600 → 504 / 552 / 600.
    expect(valuesOf(candidates, 'grid', 'x')).toEqual([504, 552, 600])
    // y edges are 300 / 330 / 360 → 304 / 328 / 360.
    expect(valuesOf(candidates, 'grid', 'y')).toEqual([304, 328, 360])
  })

  it('restricts each grid candidate to the edge it was computed for', () => {
    const candidates = generateSnapCandidates(layout).filter((one) => one.kind === 'grid')

    expect(candidates.map((one) => one.edge)).toEqual([
      'start',
      'center',
      'end',
      'start',
      'center',
      'end',
    ])
  })

  it('produces no grid candidates without a grid size', () => {
    expect(valuesOf(generateSnapCandidates({ ...layout, gridSize: 0 }), 'grid', 'x')).toEqual([])
  })

  it('takes left, centre and right of every sibling', () => {
    const candidates = generateSnapCandidates(layout)

    expect(valuesOf(candidates, 'edge', 'x')).toEqual([0, 50, 100, 140, 190, 240, 280, 330, 380])
    expect(valuesOf(candidates, 'edge', 'y')).toEqual([20, 20, 20, 50, 50, 50, 80, 80, 80])
  })

  it('carries the sibling id and its perpendicular extent, which is what bounds the guide', () => {
    const found = generateSnapCandidates(layout).find(
      (one) => one.kind === 'edge' && one.axis === 'x' && one.value === 140,
    )

    expect(found?.sourceId).toBe('node_b')
    expect([found?.from, found?.to]).toEqual([20, 80])
  })

  it('takes the container edges and centres', () => {
    const candidates = generateSnapCandidates(layout)

    expect(valuesOf(candidates, 'center', 'x')).toEqual([0, 300, 600])
    expect(valuesOf(candidates, 'center', 'y')).toEqual([0, 100, 200])
  })

  it('takes user guides on their own axis only', () => {
    const candidates = generateSnapCandidates(layout)

    expect(valuesOf(candidates, 'guide', 'x')).toEqual([250])
    expect(valuesOf(candidates, 'guide', 'y')).toEqual([])
  })

  it('equalises each opening between adjacent siblings', () => {
    const candidates = generateSnapCandidates(layout)

    // Openings are 100→140 and 240→280, both 40 wide, and the moving box is 100: no room.
    expect(valuesOf(candidates, 'spacing', 'x')).toEqual([])

    // With a 20-wide box the gaps come to 10 either side.
    const narrow = generateSnapCandidates({ ...layout, moving: rect(500, 300, 20, 60) })

    expect(valuesOf(narrow, 'spacing', 'x')).toEqual([110, 250])

    const found = narrow.find((one) => one.kind === 'spacing' && one.value === 110)

    expect(found?.spacing).toEqual({ gap: 10, before: 100, after: 140 })
    expect(found?.edge).toBe('start')
  })

  it('pairs a sibling with its neighbour in the same band, not with whatever sorts next', () => {
    // `d` sits in the row below and starts before `b`, so a strictly consecutive pairing would let
    // it break the opening between `a` and `b`. Found in the browser, recorded as ADR-090.
    const rows = generateSnapCandidates({
      ...layout,
      moving: rect(500, 300, 20, 60),
      siblings: [...layout.siblings, box('d', 60, 400, 200, 120)],
    })

    expect(valuesOf(rows, 'spacing', 'x')).toEqual([110, 250])
  })

  it('skips an opening whose siblings do not overlap on the other axis', () => {
    const stacked = generateSnapCandidates({
      ...layout,
      moving: rect(500, 300, 20, 60),
      siblings: [box('a', 0, 20, 100, 60), box('b', 140, 400, 100, 60)],
    })

    expect(valuesOf(stacked, 'spacing', 'x')).toEqual([])
  })

  it('sorts siblings before pairing them, so declaration order does not decide the openings', () => {
    const shuffled = generateSnapCandidates({
      ...layout,
      moving: rect(500, 300, 20, 60),
      siblings: [box('c', 280, 20, 100, 60), box('a', 0, 20, 100, 60), box('b', 140, 20, 100, 60)],
    })

    expect(valuesOf(shuffled, 'spacing', 'x')).toEqual([110, 250])
  })

  it('offers no equal-spacing position when the opening is exactly the moving size', () => {
    const flush = generateSnapCandidates({
      ...layout,
      moving: rect(500, 300, 40, 60),
    })

    expect(valuesOf(flush, 'spacing', 'x')).toEqual([])
  })
})
