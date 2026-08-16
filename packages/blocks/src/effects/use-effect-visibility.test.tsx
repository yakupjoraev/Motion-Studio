import { MotionSchedulerProvider } from '@motion-studio/motion'
import { effectId } from '@motion-studio/schema'
import type { EffectInstance } from '@motion-studio/schema'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { blockRegistry } from '../registry'

import { EffectStack } from './effect-stack'

type Observed = (entries: readonly Partial<IntersectionObserverEntry>[]) => void

/** The one observer the scheduler pools, captured so a test can say what it saw. */
let notify: Observed | null = null

class FakeObserver {
  constructor(callback: IntersectionObserverCallback) {
    notify = (entries) => {
      callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver)
    }
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

const effect: EffectInstance = {
  id: 'fx_1',
  effectId: effectId('aurora-background'),
  params: {},
  layer: 'behind',
  blendMode: 'normal',
  opacity: 1,
}

beforeEach(() => {
  notify = null
  vi.stubGlobal('IntersectionObserver', FakeObserver)
})

describe('an effect layer inside a scheduler', () => {
  it('holds still until the shared observer says it is on screen', () => {
    render(
      <MotionSchedulerProvider>
        <EffectStack effects={[effect]} registry={blockRegistry} />
      </MotionSchedulerProvider>,
    )

    const layer = screen.getByTestId('effect-layer')

    // Paused before the first callback: an effect two screens down should not be animating while
    // nobody has established that it is visible.
    expect(layer.dataset['effectOffscreen']).toBe('true')

    act(() => {
      notify?.([{ target: layer, isIntersecting: true, intersectionRatio: 1 }])
    })

    expect(layer.dataset['effectOffscreen']).toBe('false')

    act(() => {
      notify?.([{ target: layer, isIntersecting: false, intersectionRatio: 0 }])
    })

    expect(layer.dataset['effectOffscreen']).toBe('true')
  })

  it('runs unconditionally where there is no scheduler — Storybook, an exported page', () => {
    render(<EffectStack effects={[effect]} registry={blockRegistry} />)

    expect(screen.getByTestId('effect-layer').dataset['effectOffscreen']).toBeUndefined()
  })

  // ANIMATION_SYSTEM.md § GPU discipline: three at once, and the fourth holds its static
  // composition. `particles` is the catalogue's `heavy` effect, so four of them is the case.
  it('caps the heavy effects on screen at three', () => {
    const heavy = (id: string): EffectInstance => ({
      ...effect,
      id,
      effectId: effectId('particles'),
    })

    render(
      <MotionSchedulerProvider>
        <EffectStack
          effects={[heavy('fx_1'), heavy('fx_2'), heavy('fx_3'), heavy('fx_4')]}
          registry={blockRegistry}
        />
      </MotionSchedulerProvider>,
    )

    const layers = screen.getAllByTestId('effect-layer')

    act(() => {
      notify?.(layers.map((target) => ({ target, isIntersecting: true, intersectionRatio: 1 })))
    })

    expect(layers.map((layer) => layer.dataset['effectCapped'])).toEqual([
      'false',
      'false',
      'false',
      'true',
    ])
  })
})
