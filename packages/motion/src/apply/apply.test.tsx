import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { clearResolutionCache } from '../model/resolve'
import { registry, spec } from '../test/presets'

import { CssMotion } from './css-motion'
import { MotionNode, assertOneEngine } from './motion-node'
import { toStyle, toTransition } from './to-style'
import { useWillChange } from './use-will-change'

beforeEach(() => {
  clearResolutionCache()
})

describe('toStyle', () => {
  it('folds the transform components into one declaration, in the order written', () => {
    expect(toStyle({ y: -8, scale: 1.05, opacity: 0.5 })).toEqual({
      transform: 'translateY(-8px) scale(1.05)',
      opacity: 0.5,
    })
  })

  it('gives lengths pixels and angles degrees, and leaves strings alone', () => {
    expect(toStyle({ x: 4, rotate: 90, boxShadow: '0 0 4px red' })).toEqual({
      transform: 'translateX(4px) rotate(90deg)',
      boxShadow: '0 0 4px red',
    })
  })

  it('takes the last value of a keyframe list, which is where it lands', () => {
    expect(toStyle({ opacity: [0, 0.5, 1] })).toEqual({ opacity: 1 })
  })
})

describe('toTransition', () => {
  it('names every property it animates, with the curve and the delay', () => {
    expect(toTransition(['opacity', 'transform'], 240, 60, 'cubic-bezier(0.2, 0, 0, 1)')).toBe(
      'opacity 240ms cubic-bezier(0.2, 0, 0, 1) 60ms, transform 240ms cubic-bezier(0.2, 0, 0, 1) 60ms',
    )
  })

  it('falls back to `all` when nothing named itself', () => {
    expect(toTransition([], 120, 0, 'linear')).toBe('all 120ms linear 0ms')
  })
})

describe('useWillChange', () => {
  it('adds the hint on start and removes it on stop — PERFORMANCE.md § Layer count', () => {
    const element = document.createElement('div')
    const ref = { current: element as HTMLElement | null }
    const { result } = renderHook(() => useWillChange(ref, ['transform', 'opacity']))

    act(() => result.current.start())

    expect(element.style.willChange).toBe('transform, opacity')

    act(() => result.current.stop())

    expect(element.style.willChange).toBe('')
  })

  it('removes the hint when the component that held it unmounts mid-gesture', () => {
    const element = document.createElement('div')
    const ref = { current: element as HTMLElement | null }
    const { result, unmount } = renderHook(() => useWillChange(ref, ['transform']))

    act(() => result.current.start())

    expect(element.style.willChange).toBe('transform')

    unmount()

    expect(element.style.willChange).toBe('')
  })

  it('has nothing to hint about when the resolution animates nothing', () => {
    const element = document.createElement('div')
    const ref = { current: element as HTMLElement | null }
    const { result } = renderHook(() => useWillChange(ref, []))

    act(() => result.current.start())

    expect(element.style.willChange).toBe('')
  })
})

const HOVER = {
  engine: 'css',
  variants: { rest: { y: 0 }, hover: { y: -4 } },
  transition: { duration: 180 },
  listeners: [{ event: 'hover', variant: 'hover' }],
} as const

describe('CssMotion', () => {
  it('renders the resting variant and switches to the one the listener names', () => {
    render(
      <CssMotion resolved={HOVER}>
        <span>child</span>
      </CssMotion>,
    )

    const wrapper = screen.getByText('child').parentElement

    expect(wrapper?.getAttribute('data-motion-variant')).toBe('rest')
    expect(wrapper?.style.transition).toBe('y 180ms linear 0ms')

    act(() => {
      fireEvent.pointerOver(wrapper as HTMLElement)
    })

    expect(wrapper?.getAttribute('data-motion-variant')).toBe('hover')
    expect(wrapper?.style.transform).toBe('translateY(-4px)')
  })

  it('holds the resting variant and drops the transition when it is not active', () => {
    render(
      <CssMotion active={false} resolved={HOVER}>
        <span>child</span>
      </CssMotion>,
    )

    const wrapper = screen.getByText('child').parentElement

    act(() => {
      fireEvent.pointerOver(wrapper as HTMLElement)
    })

    expect(wrapper?.getAttribute('data-motion-variant')).toBe('rest')
    expect(wrapper?.style.transition).toBe('')
  })
})

describe('assertOneEngine', () => {
  it('throws when two engines want the same property', () => {
    expect(() =>
      assertOneEngine([
        { channel: 'entrance', resolved: { engine: 'motion', variants: { a: { y: 0 } } } },
        { channel: 'continuous', resolved: { engine: 'css', properties: ['transform'] } },
      ]),
    ).toThrow(/Two engines on one element/)
  })

  it('says nothing when the engines differ but the properties do not overlap', () => {
    expect(() =>
      assertOneEngine([
        { channel: 'entrance', resolved: { engine: 'motion', variants: { a: { opacity: 1 } } } },
        { channel: 'hover', resolved: { engine: 'css', variants: { b: { boxShadow: 'none' } } } },
      ]),
    ).not.toThrow()
  })
})

describe('MotionNode', () => {
  it('routes to the engine the composition settled on', () => {
    render(
      <MotionNode motion={{ hover: spec('glow', 'hover') }} presets={registry} scale={1}>
        <span>card</span>
      </MotionNode>,
    )

    expect(screen.getByText('card').parentElement?.getAttribute('data-motion-variant')).toBe('rest')
  })

  it('renders a node with no motion at all, and nothing else', () => {
    render(
      <MotionNode motion={{}} presets={registry} scale={1}>
        <span>plain</span>
      </MotionNode>,
    )

    expect(screen.getByText('plain')).toBeDefined()
  })

  it('drops the cursor channel entirely under reduced motion', () => {
    render(
      <MotionNode
        forceReduced
        motion={{ cursor: spec('spotlight', 'cursor') }}
        presets={registry}
        scale={1}
      >
        <span>surface</span>
      </MotionNode>,
    )

    const wrapper = screen.getByText('surface').parentElement

    expect(wrapper?.style.getPropertyValue('--ms-spotlight-radius')).toBe('')
  })
})
