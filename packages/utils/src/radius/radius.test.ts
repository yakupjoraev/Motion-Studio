import { describe, expect, it } from 'vitest'

import { innerRadius } from './radius'

describe('innerRadius', () => {
  it('subtracts the gap from the outer radius', () => {
    expect(innerRadius(12, 8)).toBe(4)
  })

  it('reproduces the lg card with p-2 example from DESIGN_SYSTEM.md § Radius', () => {
    // lg is 12, p-2 is 8, and the child should land on xs, which is 4.
    expect(innerRadius(12, 8)).toBe(4)
  })

  it('never returns a negative radius', () => {
    expect(innerRadius(4, 8)).toBe(0)
  })

  it('returns 0 when the gap exactly consumes the radius', () => {
    expect(innerRadius(8, 8)).toBe(0)
  })

  it('returns the outer radius when there is no gap', () => {
    expect(innerRadius(16, 0)).toBe(16)
  })

  it('handles the fractional radii a radiusScale of 0.5 produces', () => {
    expect(innerRadius(6, 4)).toBe(2)
  })
})
