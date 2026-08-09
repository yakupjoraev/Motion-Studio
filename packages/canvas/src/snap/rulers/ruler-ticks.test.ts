import { describe, expect, it } from 'vitest'

import { MIN_MAJOR_SPACING_PX, majorTickStep, minorTickStep, rulerTicks } from './ruler-ticks'

describe('majorTickStep', () => {
  it('gives the three spacings the canvas is specified at', () => {
    expect(majorTickStep(1)).toBe(100)
    expect(majorTickStep(0.25)).toBe(500)
    expect(majorTickStep(2)).toBe(50)
  })

  it('holds at five zoom levels across the range', () => {
    expect([0.1, 0.5, 1.5, 3, 4].map(majorTickStep)).toEqual([1000, 200, 100, 50, 50])
  })

  it('never puts a major tick closer than the minimum', () => {
    for (let zoom = 0.1; zoom <= 4; zoom += 0.05) {
      expect(majorTickStep(zoom) * zoom).toBeGreaterThanOrEqual(MIN_MAJOR_SPACING_PX)
    }
  })

  it('falls back to the top of the ladder below any usable zoom', () => {
    expect(majorTickStep(0.00001)).toBe(50000)
  })
})

describe('minorTickStep', () => {
  it('subdivides by the leading digit', () => {
    expect(minorTickStep(100)).toBe(10)
    expect(minorTickStep(200)).toBe(50)
    expect(minorTickStep(500)).toBe(100)
    expect(minorTickStep(1000)).toBe(100)
  })

  it('keeps a minor tick at least 10 screen px wide at every zoom', () => {
    for (let zoom = 0.1; zoom <= 4; zoom += 0.05) {
      expect(minorTickStep(majorTickStep(zoom)) * zoom).toBeGreaterThanOrEqual(10)
    }
  })
})

describe('rulerTicks', () => {
  it('lists the multiples inside the range', () => {
    expect(rulerTicks(-120, 250, 100)).toEqual([-100, 0, 100, 200])
  })

  it('includes a multiple that lands on the edge', () => {
    expect(rulerTicks(0, 200, 100)).toEqual([0, 100, 200])
  })

  it('returns nothing for an empty range or a step of zero', () => {
    expect(rulerTicks(200, 100, 50)).toEqual([])
    expect(rulerTicks(0, 100, 0)).toEqual([])
  })
})
