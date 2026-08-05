import { contrastRatio } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { NEUTRAL, RAMPS, RAMP_STEPS } from './color'
import { GRADIENT, GRADIENT_SCRIM, type Gradient, type GradientToken } from './gradient'

/**
 * `DESIGN_SYSTEM.md` § The ten presets: "the test asserts the declared value, so a preset cannot claim
 * readability it does not have". That is the point of this suite — `readable` is a promise about text
 * placed directly on the gradient, and a stop edited later must either keep the promise or drop it.
 */

const tokens = Object.keys(GRADIENT) as GradientToken[]

const everyStop = (gradient: Gradient): readonly string[] =>
  gradient.kind === 'mesh'
    ? gradient.points.map((point) => point.color)
    : gradient.stops.map((stop) => stop.color)

const shippedColors: ReadonlySet<string> = new Set<string>(
  Object.values(RAMPS).flatMap((ramp) => RAMP_STEPS.map((step) => ramp[step])),
)

describe.each(tokens)('%s', (token) => {
  const preset = GRADIENT[token]
  const stops = everyStop(preset.gradient)

  it('takes every stop from a ramp, so it inherits the palette', () => {
    for (const color of stops) {
      expect(shippedColors.has(color), color).toBe(true)
    }
  })

  it('has at least three stops, or it is not a gradient worth a preset', () => {
    expect(stops.length).toBeGreaterThanOrEqual(3)
  })

  it('keeps the promise its readable field makes', () => {
    if (preset.readable === null) {
      // A display gradient: assert it genuinely has no readable foreground, rather than trusting the
      // null. Both ends of the neutral ramp are tried, which is every candidate a block would reach for.
      const best = [NEUTRAL[50], NEUTRAL[950]].map((foreground) =>
        Math.min(...stops.map((stop) => contrastRatio(foreground, stop))),
      )

      expect(Math.max(...best)).toBeLessThan(4.5)
      return
    }

    for (const stop of stops) {
      expect(contrastRatio(preset.readable, stop), stop).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('the preset set', () => {
  it('ships ten presets', () => {
    expect(tokens).toHaveLength(10)
  })

  it('is mostly linear: the one form that exports to CSS with no fallback', () => {
    const kinds = tokens.map((token) => GRADIENT[token].gradient.kind)

    expect(kinds.filter((kind) => kind === 'linear')).toHaveLength(8)
    expect(kinds.filter((kind) => kind === 'mesh')).toHaveLength(1)
    expect(kinds.filter((kind) => kind === 'conic')).toHaveLength(1)
  })

  it('splits four display presets against six readable ones', () => {
    const display = tokens.filter((token) => GRADIENT[token].readable === null)

    expect(display).toEqual(['aurora', 'sunset', 'ember', 'cyber'])
  })

  it('does not make every readable preset need light text', () => {
    // A preset set where every entry needs light text only works on one kind of page.
    const readable = tokens
      .map((token) => GRADIENT[token].readable)
      .filter((value) => value !== null)

    expect(new Set(readable)).toEqual(new Set([NEUTRAL[50], NEUTRAL[950]]))
  })

  it('keeps every linear angle and every stop position inside its own range', () => {
    for (const token of tokens) {
      const gradient = GRADIENT[token].gradient

      if (gradient.kind === 'mesh') {
        for (const point of gradient.points) {
          expect(point.x, token).toBeGreaterThanOrEqual(0)
          expect(point.x, token).toBeLessThanOrEqual(100)
          expect(point.y, token).toBeGreaterThanOrEqual(0)
          expect(point.y, token).toBeLessThanOrEqual(100)
          expect(point.radius, token).toBeGreaterThan(0)
        }
        continue
      }

      const positions = gradient.stops.map((stop) => stop.position)

      expect(positions[0], token).toBe(0)
      expect(positions[positions.length - 1], token).toBe(100)
      expect(positions, token).toEqual([...positions].sort((a, b) => a - b))
    }
  })

  it('sweeps cyber back to the hue it started on, which is why it is conic', () => {
    const cyber = GRADIENT.cyber.gradient

    expect(cyber.kind).toBe('conic')
    expect(cyber.stops[0].color).toBe(cyber.stops[2].color)
  })
})

describe('GRADIENT_SCRIM', () => {
  it('carries the two documented values, one per text direction', () => {
    expect(GRADIENT_SCRIM.dark).toBe('oklch(0% 0 0 / 0.45)')
    expect(GRADIENT_SCRIM.light).toBe('oklch(100% 0 0 / 0.55)')
  })
})
