import { describe, expect, it } from 'vitest'

import { SPARKLINE_VIEWBOX, sparklinePath } from './sparkline'

describe('sparklinePath', () => {
  it('draws nothing from fewer than two points', () => {
    expect(sparklinePath([])).toEqual({ line: '', area: '' })
    expect(sparklinePath([5])).toEqual({ line: '', area: '' })
  })

  it('spans the full viewBox for a rising series', () => {
    // Two points: the low one sits on the baseline, the high one on the top edge.
    expect(sparklinePath([0, 10]).line).toBe('M0 32 L100 0')
  })

  it('inverts for a falling series, because SVG y grows downward', () => {
    expect(sparklinePath([10, 0]).line).toBe('M0 0 L100 32')
  })

  it('puts a flat series on the centre line rather than dividing by zero', () => {
    const { line } = sparklinePath([4, 4, 4])

    expect(line).toBe('M0 16 L50 16 L100 16')
    expect(line).not.toContain('NaN')
  })

  it('spaces points evenly across the width', () => {
    expect(sparklinePath([0, 5, 10]).line).toBe('M0 32 L50 16 L100 0')
  })

  it('closes the area along the baseline', () => {
    const { area } = sparklinePath([0, 10])

    expect(area).toBe(
      `M0 32 L100 0 L100 ${SPARKLINE_VIEWBOX.height} L0 ${SPARKLINE_VIEWBOX.height} Z`,
    )
  })

  it('ignores values that are not finite rather than emitting NaN', () => {
    const { line } = sparklinePath([0, Number.NaN, 10, Number.POSITIVE_INFINITY])

    expect(line).toBe('M0 32 L100 0')
  })

  /** ADR-123: the thumbnail generator compares runs byte for byte, and an unrounded path would not. */
  it('rounds to two decimals, so the same series always produces the same bytes', () => {
    const values = [1, 7, 3, 9, 2, 8, 4]

    expect(sparklinePath(values)).toEqual(sparklinePath([...values]))

    for (const number of sparklinePath(values).line.match(/[\d.]+/g) ?? []) {
      expect((number.split('.')[1] ?? '').length).toBeLessThanOrEqual(2)
    }
  })

  it('handles negative values by normalising against the range', () => {
    expect(sparklinePath([-10, 0, 10]).line).toBe('M0 32 L50 16 L100 0')
  })
})
