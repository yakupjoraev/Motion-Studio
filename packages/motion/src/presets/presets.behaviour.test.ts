import { describe, expect, it } from 'vitest'

import { motionProperties } from '../model/compose'
import type { ResolveContext } from '../model/preset.types'

import { counter } from './entrance/counter'
import { textReveal } from './entrance/text-reveal'
import { magneticOffset } from './hover/magnetic'
import { tiltAngles } from './hover/tilt-3d'
import { PRESETS, presetRegistry } from './index'
import { marqueeTrack } from './scroll/marquee'

const ctx = (overrides: Partial<ResolveContext> = {}): ResolveContext => ({
  reduced: false,
  scale: 1,
  presets: presetRegistry,
  ...overrides,
})

describe('marquee', () => {
  it('translates by exactly half the doubled track, which is what makes the seam invisible', () => {
    expect(marqueeTrack({ contentWidth: 800, containerWidth: 600 })).toEqual({
      copies: 2,
      translatePercent: -50,
    })
  })

  it('repeats content narrower than the container before doubling it', () => {
    // 200 px of content in a 600 px container: three copies fill it, six make the loop seamless.
    expect(marqueeTrack({ contentWidth: 200, containerWidth: 600 })).toEqual({
      copies: 6,
      translatePercent: -50,
    })
  })

  it('has a track to translate even before the content is measured', () => {
    expect(marqueeTrack({ contentWidth: 0, containerWidth: 600 })).toEqual({
      copies: 2,
      translatePercent: -50,
    })
  })
})

describe('magnetic', () => {
  it('pulls toward the cursor in proportion to the strength', () => {
    expect(
      magneticOffset({
        pointer: { x: 140, y: 100 },
        centre: { x: 100, y: 100 },
        strength: 0.5,
        radius: 200,
      }),
    ).toEqual({ x: 20, y: 0 })
  })

  it('lets go outside the radius', () => {
    expect(
      magneticOffset({
        pointer: { x: 400, y: 100 },
        centre: { x: 100, y: 100 },
        strength: 0.5,
        radius: 200,
      }),
    ).toEqual({ x: 0, y: 0 })
  })

  it('writes only custom properties, so it composes with every other channel', () => {
    const resolved = magneticResolved()

    expect(Object.keys(resolved.cssVars ?? {})).toContain('--ms-magnetic-x')
    expect([...motionProperties(resolved)]).toEqual(['transform'])
  })
})

const magneticResolved = () => {
  const preset = presetRegistry.get('magnetic')

  if (preset === undefined) {
    throw new Error('magnetic is missing from the catalogue')
  }

  return preset.resolve(preset.defaults, ctx())
}

describe('tilt-3d', () => {
  it('tilts away from the pointer, and not at all in the centre', () => {
    expect(tiltAngles({ x: 0.5, y: 0.5 }, 10)).toEqual({ rotateX: -0, rotateY: 0 })
    expect(tiltAngles({ x: 1, y: 0 }, 10)).toEqual({ rotateX: 5, rotateY: 5 })
    expect(tiltAngles({ x: 0, y: 1 }, 10)).toEqual({ rotateX: -5, rotateY: -5 })
  })

  it('puts the perspective on the scene and the rotation on the element', () => {
    const preset = presetRegistry.get('tilt-3d')
    const resolved = preset?.resolve(preset.defaults, ctx())

    expect(resolved?.keyframes).toContain('.ms-tilt-scene { perspective:')
    expect(resolved?.keyframes).toContain('.ms-tilt { transform: rotateX(')
  })
})

describe('counter', () => {
  it('shows the final value immediately under reduced motion', () => {
    const reduced = counter.resolveReduced({ ...counter.defaults, to: 512 }, ctx({ reduced: true }))

    expect(reduced.variants).toEqual({ visible: { '--ms-counter': 512 } })
    expect(reduced.transition).toEqual({ duration: 0 })
  })
})

describe('text-reveal', () => {
  /** ADR-260: the string the label carries is read off the element, because that is where it is. */
  it('keeps the whole string readable: the label carries it and the spans are hidden', () => {
    const fragment = textReveal.codegen(textReveal.defaults, {
      nodeName: 'Node',
      scale: 1,
      reduced: false,
    })

    expect(fragment.hooks?.join(' ')).toContain(
      "element.setAttribute('aria-label', element.textContent ?? '')",
    )
    expect(fragment.css).toContain('.ms-split')
  })
})

describe('the catalogue as a whole', () => {
  it('covers all six channels of § Preset catalogue', () => {
    const channels = new Set(PRESETS.map((preset) => preset.channel))

    expect([...channels].sort()).toEqual([
      'continuous',
      'cursor',
      'entrance',
      'exit',
      'hover',
      'scroll',
    ])
    expect(PRESETS.length).toBeGreaterThanOrEqual(40)
  })

  it('never repeats faster than three times a second, whatever the parameters', () => {
    for (const preset of PRESETS) {
      const resolved = preset.resolve(preset.defaults, ctx())

      if (resolved.transition?.repeat === undefined) {
        continue
      }

      expect(resolved.transition.duration ?? 0).toBeGreaterThanOrEqual(400)
    }
  })
})
