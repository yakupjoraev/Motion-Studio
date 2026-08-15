import { describe, expect, it } from 'vitest'

import { SPRINGS } from '../curves/springs'

import type { ResolvedMotion } from './preset.types'
import { MOTION_SCALES, scaleDuration, scaleMotion } from './scale'

const timed: ResolvedMotion = {
  engine: 'motion',
  variants: { visible: { opacity: 1 } },
  transition: { duration: 240, delay: 60, stagger: { each: 80, from: 'first' } },
}

const sprung: ResolvedMotion = {
  engine: 'motion',
  transition: { spring: SPRINGS.snappy, delay: 100 },
}

describe('scaleDuration', () => {
  it('is the theme scale, rounded to whole milliseconds', () => {
    expect(MOTION_SCALES).toEqual([0, 0.5, 1, 1.5])
    expect(scaleDuration(240, 0.5)).toBe(120)
    expect(scaleDuration(240, 1.5)).toBe(360)
    expect(scaleDuration(125, 0.5)).toBe(63)
    expect(scaleDuration(240, 0)).toBe(0)
  })
})

describe('scaleMotion', () => {
  it('returns the resolution itself at scale 1, so nothing downstream re-renders', () => {
    expect(scaleMotion(timed, 1)).toBe(timed)
  })

  it('scales duration, delay and stagger together', () => {
    expect(scaleMotion(timed, 0.5).transition).toEqual({
      duration: 120,
      delay: 30,
      stagger: { each: 40, from: 'first' },
    })
  })

  it('drops the spring at zero, because a spring has no duration to multiply', () => {
    const result = scaleMotion(sprung, 0)

    expect(result.transition).toEqual({ duration: 0, delay: 0 })
    expect(result.transition?.spring).toBeUndefined()
  })

  it('keeps the spring at every other scale', () => {
    expect(scaleMotion(sprung, 1.5).transition?.spring).toEqual(SPRINGS.snappy)
  })

  it('has nothing to scale when there is no transition', () => {
    const still: ResolvedMotion = { engine: 'css', className: 'ms-still' }

    expect(scaleMotion(still, 0)).toBe(still)
  })
})
