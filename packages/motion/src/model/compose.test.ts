import { beforeEach, describe, expect, it } from 'vitest'

import { context, spec } from '../test/presets'

import { CHANNEL_PRECEDENCE, collides, composeMotion, motionProperties } from './compose'
import { clearResolutionCache } from './resolve'

beforeEach(() => {
  clearResolutionCache()
})

describe('motionProperties', () => {
  it('is the union of the variant keys and the declared properties', () => {
    expect([
      ...motionProperties({ engine: 'motion', variants: { a: { opacity: 1, y: 0 } } }),
    ]).toEqual(['opacity', 'y'])
    expect([...motionProperties({ engine: 'css', properties: ['transform'] })]).toEqual([
      'transform',
    ])
  })

  it('leaves custom properties out, which is why a cursor preset touches nothing', () => {
    expect(motionProperties({ engine: 'css', cssVars: { '--ms-x': '0px' } }).size).toBe(0)
  })
})

describe('collides — ADR-143', () => {
  it('treats the whole transform as every one of its components', () => {
    expect(collides('transform', 'y')).toBe(true)
    expect(collides('scale', 'transform')).toBe(true)
  })

  it('lets two components share the element, because the engine composes them', () => {
    expect(collides('x', 'y')).toBe(false)
    expect(collides('opacity', 'boxShadow')).toBe(false)
  })
})

describe('composeMotion', () => {
  it('composes an entrance and a hover that touch different properties', () => {
    const { resolved, conflicts } = composeMotion(
      { entrance: spec('fade-up', 'entrance'), hover: spec('glow', 'hover') },
      context(),
    )

    expect(conflicts).toEqual([])
    expect(resolved.variants?.['hidden']).toEqual({ opacity: 0, y: 24 })
    expect(resolved.variants?.['hover']).toEqual({ boxShadow: '0 0 12px currentColor' })
    expect(resolved.engine).toBe('motion')
  })

  it('reports a transform collision and gives the property to `scroll` — § Composition', () => {
    const { resolved, conflicts } = composeMotion(
      { entrance: spec('fade-up', 'entrance'), scroll: spec('parallax', 'scroll') },
      context(),
    )

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({ winner: 'scroll', loser: 'entrance', properties: ['y'] })
    expect(conflicts[0]?.reason).toBe('scroll and entrance both animate y; scroll keeps it.')

    // The loser keeps what it does not share: the fade survives, the movement does not.
    expect(resolved.variants?.['hidden']).toEqual({ opacity: 0 })
    expect(resolved.variants?.['end']).toEqual({ y: -80 })
  })

  it('finds the collision between a class-driven transform and a motion value', () => {
    const { conflicts } = composeMotion(
      { entrance: spec('fade-up', 'entrance'), continuous: spec('drift', 'continuous') },
      context(),
    )

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({ winner: 'entrance', loser: 'continuous' })
    expect(conflicts[0]?.properties).toEqual(['transform'])
  })

  it('composes a cursor preset with everything, because it writes variables', () => {
    const { resolved, conflicts } = composeMotion(
      {
        entrance: spec('fade-up', 'entrance'),
        hover: spec('lift', 'hover'),
        cursor: spec('spotlight', 'cursor'),
      },
      context(),
    )

    expect(conflicts.map((conflict) => conflict.loser)).toEqual(['hover'])
    expect(resolved.cssVars).toEqual({ '--ms-spotlight-radius': '240px' })
    expect(resolved.listeners?.some((listener) => listener.event === 'pointerMove')).toBe(true)
  })

  it('merges classes, keyframes and listeners from every part', () => {
    const { resolved } = composeMotion(
      { hover: spec('glow', 'hover'), continuous: spec('drift', 'continuous') },
      context(),
    )

    expect(resolved.className).toBe('ms-drift')
    expect(resolved.keyframes).toContain('@keyframes ms-drift')
    expect(resolved.transition?.repeat).toBe('infinite')
  })

  it('takes the transition of the highest-precedence part', () => {
    const { resolved } = composeMotion(
      { entrance: spec('fade-up', 'entrance'), hover: spec('glow', 'hover') },
      context(),
    )

    expect(resolved.transition?.duration).toBe(240)
  })

  it('is nothing when every channel resolved to nothing', () => {
    const { resolved, conflicts } = composeMotion(
      { cursor: spec('spotlight', 'cursor') },
      context({ reduced: true }),
    )

    expect(resolved).toEqual({ engine: 'css' })
    expect(conflicts).toEqual([])
  })

  it('orders the channels by how long each owns the element', () => {
    expect(CHANNEL_PRECEDENCE[0]).toBe('scroll')
    expect(CHANNEL_PRECEDENCE.at(-1)).toBe('cursor')
    expect(CHANNEL_PRECEDENCE).toHaveLength(7)
  })
})
