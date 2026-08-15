import { beforeEach, describe, expect, it } from 'vitest'

import { context, registry, spec } from '../test/presets'

import { DISABLED_MOTION } from './preset.types'
import { clearResolutionCache, isReduced, resolveMotion } from './resolve'

beforeEach(() => {
  clearResolutionCache()
})

describe('resolveMotion', () => {
  it('resolves a preset through the catalogue it is handed', () => {
    const resolved = resolveMotion(spec('fade-up', 'entrance', { distance: 32 }), context())

    expect(resolved.engine).toBe('motion')
    expect(resolved.variants?.['hidden']).toEqual({ opacity: 0, y: 32 })
    expect(resolved.transition?.duration).toBe(240)
  })

  it('returns the same reference for the same inputs — the memoisation § The model asks for', () => {
    const first = resolveMotion(spec('fade-up', 'entrance', { distance: 32 }), context())
    const second = resolveMotion(spec('fade-up', 'entrance', { distance: 32 }), context())

    expect(second).toBe(first)
  })

  it('keys on the params rather than on their order', () => {
    const first = resolveMotion(
      { ...spec('fade-up', 'entrance'), params: { distance: 8, other: 'a' } },
      context(),
    )
    const second = resolveMotion(
      { ...spec('fade-up', 'entrance'), params: { other: 'a', distance: 8 } },
      context(),
    )

    expect(second).toBe(first)
  })

  it('does not reuse a resolution across scale, reduction or catalogue', () => {
    const base = spec('fade-up', 'entrance')
    const full = resolveMotion(base, context())

    expect(resolveMotion(base, context({ scale: 0.5 }))).not.toBe(full)
    expect(resolveMotion(base, context({ reduced: true }))).not.toBe(full)
    expect(resolveMotion(base, context({ presets: { ...registry } }))).not.toBe(full)
  })

  it('disables a spec that says it is disabled, and one whose preset this build has never heard of', () => {
    expect(resolveMotion({ ...spec('fade-up', 'entrance'), disabled: true }, context())).toBe(
      DISABLED_MOTION,
    )
    expect(resolveMotion(spec('from-the-future', 'entrance'), context())).toBe(DISABLED_MOTION)
  })

  it('falls back to the preset defaults when a param does not parse — ADR-139', () => {
    const resolved = resolveMotion(
      spec('fade-up', 'entrance', { distance: 'quite a lot' }),
      context(),
    )

    expect(resolved.variants?.['hidden']).toEqual({ opacity: 0, y: 24 })
  })

  it('carries the document’s stagger into the transition', () => {
    const resolved = resolveMotion(
      { ...spec('fade-up', 'entrance'), stagger: { each: 60, from: 'first' } },
      context(),
    )

    expect(resolved.transition?.stagger).toEqual({ each: 60, from: 'first' })
  })

  it('scales every duration by `motionScale`', () => {
    const resolved = resolveMotion(spec('fade-up', 'entrance'), context({ scale: 0.5 }))

    expect(resolved.transition?.duration).toBe(120)
  })

  it('takes the reduced path at scale zero — ADR-141', () => {
    expect(isReduced(context({ scale: 0 }))).toBe(true)
    expect(isReduced(context({ reduced: true }))).toBe(true)
    expect(isReduced(context())).toBe(false)
  })

  it('produces the same motion at scale zero as under reduced motion, and it takes no time', () => {
    for (const [id, channel] of [
      ['fade-up', 'entrance'],
      ['lift', 'hover'],
      ['parallax', 'scroll'],
      ['drift', 'continuous'],
    ] as const) {
      const scaled = resolveMotion(spec(id, channel), context({ reduced: false, scale: 0 }))
      const reduced = resolveMotion(spec(id, channel), context({ reduced: true, scale: 0 }))

      expect(scaled).toEqual(reduced)
      expect(scaled.transition?.duration ?? 0).toBe(0)
      expect(scaled.transition?.delay ?? 0).toBe(0)
    }
  })

  it('applies the channel policy over the preset’s own reduced answer — ADR-142', () => {
    // `parallax` returns its full two-variant scrub from `resolveReduced`; the policy is the floor.
    const resolved = resolveMotion(spec('parallax', 'scroll'), context({ reduced: true }))

    expect(Object.keys(resolved.variants ?? {})).toEqual(['end'])
    expect(resolved.listeners).toBeUndefined()
  })

  it('evicts the oldest entry rather than growing without a bound', () => {
    const first = resolveMotion(spec('fade-up', 'entrance', { distance: 0 }), context())

    for (let index = 1; index <= 1024; index += 1) {
      resolveMotion(spec('fade-up', 'entrance', { distance: index }), context())
    }

    expect(resolveMotion(spec('fade-up', 'entrance', { distance: 0 }), context())).not.toBe(first)
  })
})
