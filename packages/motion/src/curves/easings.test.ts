import { EASING } from '@motion-studio/tokens'
import { describe, expect, it } from 'vitest'

import { EASINGS, EASING_NAMES } from './easings'
import { SPRINGS, SPRING_NAMES, dampingRatio } from './springs'

describe('EASINGS', () => {
  it('is the twelve curves ANIMATION_SYSTEM.md § Curves names', () => {
    expect(EASING_NAMES).toEqual([
      'linear',
      'standard',
      'decelerate',
      'accelerate',
      'emphasized',
      'emphasizedDecelerate',
      'emphasizedAccelerate',
      'overshoot',
      'bounce',
      'anticipate',
      'expoOut',
      'circOut',
    ])
  })

  it('reads the eight shared curves from the tokens rather than restating them', () => {
    expect(EASINGS.linear).toBe(EASING.linear)
    expect(EASINGS.standard).toBe(EASING.standard)
    expect(EASINGS.decelerate).toBe(EASING.decelerate)
    expect(EASINGS.accelerate).toBe(EASING.accelerate)
    expect(EASINGS.emphasized).toBe(EASING.emphasized)
    expect(EASINGS.overshoot).toBe(EASING.spring)
    expect(EASINGS.bounce).toBe(EASING.bounce)
    expect(EASINGS.anticipate).toBe(EASING.anticipate)
  })

  it('keeps every x inside 0–1, which is what makes a curve a legal CSS easing', () => {
    for (const name of EASING_NAMES) {
      const [x1, , x2] = EASINGS[name]

      expect(x1).toBeGreaterThanOrEqual(0)
      expect(x1).toBeLessThanOrEqual(1)
      expect(x2).toBeGreaterThanOrEqual(0)
      expect(x2).toBeLessThanOrEqual(1)
    }
  })
})

describe('SPRINGS', () => {
  it('is the seven springs ANIMATION_SYSTEM.md § Curves names', () => {
    expect(SPRING_NAMES).toEqual([
      'gentle',
      'smooth',
      'snappy',
      'bouncy',
      'stiff',
      'wobbly',
      'molasses',
    ])
  })

  it('covers all three damping regimes, so the catalogue can express all three', () => {
    const ratios = SPRING_NAMES.map((name) => dampingRatio(SPRINGS[name]))

    expect(ratios.some((ratio) => ratio < 0.9)).toBe(true)
    expect(ratios.some((ratio) => ratio >= 0.9 && ratio <= 1.1)).toBe(true)
    expect(ratios.some((ratio) => ratio > 1.1)).toBe(true)
  })

  it('names `wobbly` the loosest and `molasses` the most damped', () => {
    const ratios = Object.fromEntries(
      SPRING_NAMES.map((name) => [name, dampingRatio(SPRINGS[name])]),
    )

    expect(Math.min(...Object.values(ratios))).toBe(ratios['wobbly'])
    expect(Math.max(...Object.values(ratios))).toBe(ratios['molasses'])
  })
})
