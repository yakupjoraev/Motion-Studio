import type { MotionChannel } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { DISABLED_MOTION, type ResolvedMotion } from '../model/preset.types'

import { REDUCE_POLICY, policyFor, reduce } from './policy'

const CHANNELS: readonly MotionChannel[] = [
  'entrance',
  'scroll',
  'hover',
  'press',
  'cursor',
  'continuous',
  'exit',
]

const moving: ResolvedMotion = {
  engine: 'motion',
  variants: {
    hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
  },
  transition: { duration: 600, delay: 80 },
  listeners: [{ event: 'inView', variant: 'visible' }],
}

const painted: ResolvedMotion = {
  engine: 'css',
  variants: {
    rest: { y: 0, boxShadow: 'none', color: 'red' },
    hover: { y: -4, boxShadow: '0 2px 8px black', color: 'blue' },
  },
  transition: { duration: 180 },
}

describe('REDUCE_POLICY', () => {
  it('covers every channel ANIMATION_SYSTEM.md § Reduced motion lists', () => {
    expect(Object.keys(REDUCE_POLICY).sort()).toEqual([...CHANNELS].sort())
  })

  it('disables cursor and continuous entirely, rather than slowing them', () => {
    expect(policyFor('cursor')).toEqual({ kind: 'disabled' })
    expect(policyFor('continuous')).toEqual({ kind: 'disabled' })
    expect(reduce(moving, policyFor('cursor'))).toBe(DISABLED_MOTION)
    expect(reduce(moving, policyFor('continuous'))).toBe(DISABLED_MOTION)
  })
})

describe('reduce', () => {
  it('entrance: opacity only, 120 ms', () => {
    const result = reduce(moving, policyFor('entrance'))

    expect(result.variants).toEqual({ hidden: { opacity: 0 }, visible: { opacity: 1 } })
    expect(result.transition).toEqual({ duration: 120, delay: 80 })
    expect(result.listeners).toEqual(moving.listeners)
  })

  it('scroll: the end state, standing still, with nothing scrubbing it', () => {
    const result = reduce(moving, policyFor('scroll'))

    expect(result.variants).toEqual({ visible: { opacity: 1, y: 0, filter: 'blur(0px)' } })
    expect(result.transition).toEqual({ duration: 0, delay: 0 })
    expect(result.listeners).toBeUndefined()
  })

  it('hover: colour and shadow only, no transform', () => {
    const result = reduce(painted, policyFor('hover'))

    expect(result.variants).toEqual({
      rest: { boxShadow: 'none', color: 'red' },
      hover: { boxShadow: '0 2px 8px black', color: 'blue' },
    })
  })

  it('press: opacity as well as the paint', () => {
    const pressed: ResolvedMotion = {
      engine: 'css',
      variants: { down: { scale: 0.98, opacity: 0.8, color: 'red' } },
    }

    expect(reduce(pressed, policyFor('press')).variants).toEqual({
      down: { opacity: 0.8, color: 'red' },
    })
  })

  it('exit: instant, and the end state is still the end state', () => {
    const result = reduce(moving, policyFor('exit'))

    expect(result.transition).toEqual({ duration: 0, delay: 0 })
    expect(result.variants).toEqual(moving.variants)
  })

  it('filters the properties a class-driven preset declares, and leaves the class alone', () => {
    const classy: ResolvedMotion = {
      engine: 'css',
      className: 'ms-drift',
      keyframes: '@keyframes ms-drift { }',
      properties: ['transform', 'opacity'],
    }

    const result = reduce(classy, policyFor('entrance'))

    expect(result.properties).toEqual(['opacity'])
    expect(result.className).toBe('ms-drift')
    expect(result.keyframes).toBe('@keyframes ms-drift { }')
  })

  it('has nothing to strip from a resolution that animates nothing', () => {
    expect(reduce({ engine: 'css' }, policyFor('scroll'))).toEqual({
      engine: 'css',
      transition: { duration: 0, delay: 0 },
    })
  })
})
