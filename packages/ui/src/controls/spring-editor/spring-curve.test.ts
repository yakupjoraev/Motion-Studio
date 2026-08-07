import { describe, expect, it } from 'vitest'

import { OVERSHOOT_CEILING, STEPS, settleFrame, settleMs, springPolyline } from './spring-curve'

import type { SpringConfig } from '@motion-studio/motion'

const SNAPPY: SpringConfig = { stiffness: 400, damping: 30, mass: 1 }
const BOUNCY: SpringConfig = { stiffness: 300, damping: 10, mass: 1 }
const STUCK: SpringConfig = { stiffness: 20, damping: 1, mass: 5 }

describe('springPolyline', () => {
  it('emits one point per simulated frame', () => {
    expect(springPolyline(SNAPPY, 200, 100).split(' ')).toHaveLength(STEPS)
  })

  it('starts at the left edge, at rest', () => {
    // Position 0 maps to the bottom of the box, which is where `y = height`.
    expect(springPolyline(SNAPPY, 200, 100).split(' ')[0]).toBe('0.00,100.00')
  })

  it('ends at the right edge', () => {
    expect(springPolyline(SNAPPY, 200, 100).split(' ').at(-1)?.startsWith('200.00,')).toBe(true)
  })

  it('scales to the box it was given', () => {
    expect(springPolyline(SNAPPY, 400, 50).split(' ').at(-1)?.startsWith('400.00,')).toBe(true)
  })

  it('keeps the vertical range fixed, so an overshoot is visible rather than normalised away', () => {
    const tops = springPolyline(BOUNCY, 200, 100)
      .split(' ')
      .map((point) => Number.parseFloat(point.split(',')[1] ?? ''))

    // A bouncy spring passes 1 and so rises above the rest line, without leaving the box.
    expect(Math.min(...tops)).toBeLessThan(100 - 100 / OVERSHOOT_CEILING)
    expect(Math.min(...tops)).toBeGreaterThan(0)
  })
})

describe('settleFrame', () => {
  it('finds the frame a snappy spring stops moving at', () => {
    const frame = settleFrame(SNAPPY)

    expect(frame).not.toBeNull()
    expect(frame).toBeGreaterThan(0)
  })

  it('takes longer for a spring that bounces', () => {
    expect(settleFrame(BOUNCY) ?? 0).toBeGreaterThan(settleFrame(SNAPPY) ?? 0)
  })

  it('reports that a spring which never settles has not settled', () => {
    expect(settleFrame(STUCK)).toBeNull()
  })
})

describe('settleMs', () => {
  it('reads the settling frame back as milliseconds', () => {
    const frame = settleFrame(SNAPPY) ?? 0

    expect(settleMs(SNAPPY)).toBe(Math.round((frame / 60) * 1000))
  })

  it('passes the unsettled case through', () => {
    expect(settleMs(STUCK)).toBeNull()
  })
})
