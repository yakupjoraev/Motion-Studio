import { describe, expect, it } from 'vitest'

import { simulateSpring } from './simulate'

import type { SpringConfig } from './simulate'

/** One frame at 60 Hz — the rate the spring editor redraws at, and the rate prompt 30 pins stability to. */
const FRAME = 1 / 60

/**
 * `ANIMATION_SYSTEM.md` § Springs, transcribed. The named table itself is prompt 30's deliverable
 * (`curves/springs.ts`); publishing a second copy as a module here is the duplication that prompt
 * warns about, so the convergence assertion reads it as a fixture instead.
 */
const NAMED_SPRINGS = {
  gentle: { stiffness: 120, damping: 20, mass: 1 },
  smooth: { stiffness: 180, damping: 24, mass: 1 },
  snappy: { stiffness: 300, damping: 26, mass: 0.9 },
  bouncy: { stiffness: 400, damping: 18, mass: 1 },
  stiff: { stiffness: 550, damping: 32, mass: 0.8 },
  wobbly: { stiffness: 220, damping: 12, mass: 1.2 },
  molasses: { stiffness: 60, damping: 26, mass: 1.6 },
} as const satisfies Record<string, SpringConfig>

/** Four seconds. The slowest named spring, `molasses`, needs 2.5 s to come within 0.001 of the target. */
const CONVERGENCE_STEPS = 240

/** ζ = c / (2·√(k·m)). The three regimes below are picked by this number, not by eye. */
const dampingRatio = ({ stiffness, damping, mass }: SpringConfig): number =>
  damping / (2 * Math.sqrt(stiffness * mass))

const isMonotone = (values: readonly number[]): boolean => {
  let previous = Number.NEGATIVE_INFINITY

  for (const value of values) {
    if (value < previous) {
      return false
    }

    previous = value
  }

  return true
}

/** `NaN` rather than `undefined` on an empty curve, so an assertion fails instead of passing vacuously. */
const settledAt = (values: readonly number[]): number => values[values.length - 1] ?? Number.NaN

describe('simulateSpring', () => {
  it('starts at the release position', () => {
    expect(simulateSpring(NAMED_SPRINGS.gentle, FRAME, 4)[0]).toBe(0)
  })

  it('returns one sample per step', () => {
    expect(simulateSpring(NAMED_SPRINGS.gentle, FRAME, 30)).toHaveLength(30)
  })

  it('does not overshoot at the critical damping value', () => {
    // ζ = 20 / (2·√(100·1)) = 1 exactly.
    const critical: SpringConfig = { stiffness: 100, damping: 20, mass: 1 }

    expect(dampingRatio(critical)).toBe(1)

    const curve = simulateSpring(critical, FRAME, CONVERGENCE_STEPS)

    expect(Math.max(...curve)).toBeLessThanOrEqual(1)
    expect(isMonotone(curve)).toBe(true)
  })

  it('overshoots and settles when under-damped', () => {
    const under: SpringConfig = { stiffness: 400, damping: 10, mass: 1 }

    expect(dampingRatio(under)).toBeLessThan(1)

    const curve = simulateSpring(under, FRAME, CONVERGENCE_STEPS)

    expect(Math.max(...curve)).toBeGreaterThan(1)
    expect(settledAt(curve)).toBeCloseTo(1, 3)
  })

  it('approaches the target slowly and without overshoot when over-damped', () => {
    const over: SpringConfig = { stiffness: 100, damping: 40, mass: 1 }

    expect(dampingRatio(over)).toBeGreaterThan(1)

    const curve = simulateSpring(over, FRAME, 120)
    const critical = simulateSpring({ stiffness: 100, damping: 20, mass: 1 }, FRAME, 120)

    expect(Math.max(...curve)).toBeLessThanOrEqual(1)
    expect(isMonotone(curve)).toBe(true)
    // "Slow" needs something to be slow against: at the same stiffness, still short of critical at 2 s.
    expect(settledAt(curve)).toBeLessThan(settledAt(critical))
  })

  it.each(Object.entries(NAMED_SPRINGS))('converges to the target for %s', (_name, config) => {
    const curve = simulateSpring(config, FRAME, CONVERGENCE_STEPS)

    expect(Math.abs(settledAt(curve) - 1)).toBeLessThan(0.001)
  })

  it('stays finite at the stiffest named spring, where explicit Euler diverges', () => {
    const curve = simulateSpring(NAMED_SPRINGS.stiff, FRAME, CONVERGENCE_STEPS)

    expect(curve.every(Number.isFinite)).toBe(true)
  })
})
