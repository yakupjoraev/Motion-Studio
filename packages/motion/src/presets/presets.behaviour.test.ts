import { describe, expect, it } from 'vitest'

import { motionProperties } from '../model/compose'
import type { ResolveContext } from '../model/preset.types'

import { counter } from './entrance/counter'
import { textReveal } from './entrance/text-reveal'
import { magneticOffset } from './hover/magnetic'
import { tiltAngles } from './hover/tilt-3d'
import { PRESETS, presetRegistry } from './index'
import { horizontalScroll } from './scroll/horizontal-scroll'
import { marqueeTrack } from './scroll/marquee'
import { scrollTimeline } from './scroll/scroll-timeline'

const ctx = (overrides: Partial<ResolveContext> = {}): ResolveContext => ({
  reduced: false,
  scale: 1,
  presets: presetRegistry,
  ...overrides,
})

const ctx_ = () => ({ nodeName: 'Node', scale: 1, reduced: false })

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

    const helpers = (fragment.helpers ?? []).map((helper) => helper.source).join(' ')

    expect(helpers).toContain("element.setAttribute('aria-label', source)")
    expect(helpers).toContain("part.setAttribute('aria-hidden', 'true')")
    expect(fragment.css).toContain('.ms-split')
  })

  /** ADR-349: the split is the export's own code, so the export is where it has to be checked. */
  it('re-measures the lines when the container resizes, and only for lines', () => {
    const lines = textReveal.codegen({ ...textReveal.defaults, by: 'line' }, ctx_())
    const words = textReveal.codegen({ ...textReveal.defaults, by: 'word' }, ctx_())

    expect(lines.hooks?.join(' ')).toContain('ResizeObserver')
    expect(words.hooks?.join(' ')).not.toContain('ResizeObserver')
  })
})

describe('horizontal-scroll', () => {
  it('spends the distance against the shared progress, on the children it moves', () => {
    const resolved = horizontalScroll.resolve(horizontalScroll.defaults, ctx())

    expect(resolved.engine).toBe('css')
    expect(resolved.cssVars?.['--ms-hscroll-distance']).toBe('1600px')
    expect(resolved.keyframes).toContain(
      'translate3d(calc(var(--ms-hscroll-distance) * -1 * var(--ms-scroll-progress, 0)), 0, 0)',
    )
    // `overflow: hidden` would make the window a scroll container and take the export's pin out of
    // the page's scrollport, so the clip has to be the one that does not.
    expect(resolved.keyframes).toContain('overflow-x: clip')
  })

  it('pins in the export and quantises only when snap is on', () => {
    const plain = horizontalScroll.codegen(horizontalScroll.defaults, ctx_())
    const snapped = horizontalScroll.codegen({ ...horizontalScroll.defaults, snap: true }, ctx_())

    expect(plain.css).toContain('position: sticky')
    expect(plain.css).toContain('height: calc(100vh + 1600px)')
    expect(plain.hooks?.join(' ')).not.toContain('Math.round')
    expect(snapped.hooks?.join(' ')).toContain('Math.round(progress * stops) / stops')
    expect(snapped.hooks?.join(' ')).toContain('track.children.length')
  })
})

describe('scroll-timeline', () => {
  const stops = '0:opacity=0|0.5:opacity=1|1:y=-40'

  it('holds every property to the end, so a fade does not undo itself on the way to the lift', () => {
    const resolved = scrollTimeline.resolve({ ...scrollTimeline.defaults, keyframes: stops }, ctx())

    // CSS fills a property missing from a keyframe with the underlying value; carrying it forward is
    // what makes the emitted animation mean the sequence the user wrote.
    expect(resolved.keyframes).toContain('50% { opacity: 1 }')
    expect(resolved.keyframes).toContain('100% { opacity: 1; transform: translateY(-40px) }')
  })

  it('seeks a paused animation with a negative delay rather than running one', () => {
    const resolved = scrollTimeline.resolve(scrollTimeline.defaults, ctx())

    expect(resolved.engine).toBe('css')
    expect(resolved.keyframes).toContain('paused both')
    expect(resolved.keyframes).toContain(
      'animation-delay: calc(-1s * var(--ms-scroll-progress, 0))',
    )
    expect(resolved.properties).toEqual(['opacity', 'transform'])
  })

  it('names the animation after its own keyframes, so two nodes cannot overwrite each other', () => {
    const one = scrollTimeline.resolve({ ...scrollTimeline.defaults, keyframes: stops }, ctx())
    const other = scrollTimeline.resolve(
      { ...scrollTimeline.defaults, keyframes: '0:opacity=1|1:opacity=0' },
      ctx(),
    )

    expect(one.className).not.toBe(other.className)
  })

  it('smooths the scrub with a spring, and reads the scroll value directly when it is zero', () => {
    const smoothed = scrollTimeline.codegen(scrollTimeline.defaults, ctx_())
    const direct = scrollTimeline.codegen({ ...scrollTimeline.defaults, scrub: 0 }, ctx_())

    expect(smoothed.hooks?.join(' ')).toContain('useSpring(scrollYProgress, { visualDuration: 1')
    expect(direct.hooks?.join(' ')).not.toContain('useSpring')
    expect(direct.hooks?.join(' ')).toContain("scrollYProgress.on('change'")
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
