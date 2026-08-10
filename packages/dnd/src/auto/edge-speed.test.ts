import { describe, expect, it } from 'vitest'

import { edgeSpeed } from './edge-speed'

const BOX = { left: 0, top: 0, right: 1000, bottom: 800 }
const OPTIONS = { threshold: 60, maxSpeed: 12 }

const speed = (x: number, y: number) => edgeSpeed({ x, y }, BOX, OPTIONS)

describe('edgeSpeed', () => {
  it('is still in the middle', () => {
    expect(speed(500, 400)).toEqual({ x: 0, y: 0 })
  })

  it('is still just outside the threshold', () => {
    expect(speed(60, 400)).toEqual({ x: 0, y: 0 })
  })

  it('ramps with proximity', () => {
    expect(speed(30, 400).x).toBe(-6)
    expect(speed(15, 400).x).toBe(-9)
  })

  it('is at full speed on the edge', () => {
    expect(speed(0, 400).x).toBe(-12)
    expect(speed(1000, 400).x).toBe(12)
  })

  it('does not exceed full speed outside the box', () => {
    expect(speed(-500, 400).x).toBe(-12)
    expect(speed(1500, 400).x).toBe(12)
  })

  it('works on both axes at once, which is what a corner is', () => {
    expect(speed(0, 800)).toEqual({ x: -12, y: 12 })
  })

  it('runs the vertical ramp the same way', () => {
    expect(speed(500, 30).y).toBe(-6)
    expect(speed(500, 770).y).toBe(6)
  })
})
