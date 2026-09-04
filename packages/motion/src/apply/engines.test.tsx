import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearResolutionCache } from '../model/resolve'
import { createScheduler } from '../scheduler/create-scheduler'
import { MotionSchedulerProvider, useScheduler } from '../scheduler/scheduler-context'
import type { ScrollSource } from '../scheduler/scroll-bus'
import { registry, spec } from '../test/presets'

import { CssMotion } from './css-motion'
import { FramerMotion, settledVariant } from './framer-motion'
import { MotionNode } from './motion-node'

/** A source the test drives by hand, standing in for a window or a scrolling panel. */
const source = () => {
  const state = { listener: null as null | (() => void), offset: 0 }

  const scrollSource: ScrollSource = {
    addEventListener: (_type, listener) => {
      state.listener = listener
    },
    removeEventListener: () => {
      state.listener = null
    },
    metrics: () => ({ offset: state.offset, max: 1000 }),
  }

  return { scrollSource, state }
}

/** The shared setup stubs it once per file, and the unstub below takes that away again. */
class ObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

beforeEach(() => {
  clearResolutionCache()
  vi.stubGlobal('IntersectionObserver', ObserverStub)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createScheduler', () => {
  it('hands every subscription to the one primitive that owns it', () => {
    const frames: ((time: number) => void)[] = []

    vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) =>
      frames.push(callback),
    )
    vi.stubGlobal('cancelAnimationFrame', () => undefined)

    const { scrollSource, state } = source()
    const scheduler = createScheduler({ source: scrollSource })
    const seen: string[] = []

    const stopScroll = scheduler.onScroll(() => seen.push('scroll'))
    const stopFrame = scheduler.onFrame(() => seen.push('frame'))

    state.offset = 500
    state.listener?.()

    // One queue: the scroll flush and the frame tick are both waiting on `rAF`.
    for (const frame of [...frames]) {
      frame(16)
    }

    expect(seen).toContain('scroll')
    expect(seen).toContain('frame')
    expect(scheduler.paused).toBe(false)

    scheduler.setPaused(true)

    expect(scheduler.paused).toBe(true)

    stopScroll()
    stopFrame()
    scheduler.destroy()

    expect(state.listener).toBeNull()
  })

  it('counts its observers, which is what "one per bucket" is measured by', () => {
    const observers: unknown[] = []

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor() {
          observers.push(this)
        }
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    )

    const { scrollSource } = source()
    const scheduler = createScheduler({ source: scrollSource })
    const element = document.createElement('div')

    scheduler.observe(element, () => undefined, 0.3)
    scheduler.observe(document.createElement('div'), () => undefined, 0.26)

    expect(scheduler.observers).toBe(1)
    expect(observers).toHaveLength(1)

    scheduler.destroy()
  })
})

describe('MotionSchedulerProvider', () => {
  it('gives the tree one scheduler and passes the pause flag to it', () => {
    const { scrollSource } = source()
    const held: { scheduler: ReturnType<typeof useScheduler> } = { scheduler: null }

    const Probe = () => {
      held.scheduler = useScheduler()

      return <span>probe</span>
    }

    const view = render(
      <MotionSchedulerProvider source={scrollSource}>
        <Probe />
      </MotionSchedulerProvider>,
    )

    const first = held.scheduler

    expect(first).not.toBeNull()
    expect(first?.paused).toBe(false)

    view.rerender(
      <MotionSchedulerProvider paused source={scrollSource}>
        <Probe />
      </MotionSchedulerProvider>,
    )

    expect(held.scheduler).toBe(first)
    expect(held.scheduler?.paused).toBe(true)
  })

  it('is `null` outside a provider, so a block in Storybook simply does not subscribe', () => {
    const held: { scheduler: ReturnType<typeof useScheduler> } = { scheduler: null }

    const Probe = () => {
      held.scheduler = useScheduler()

      return <span>alone</span>
    }

    render(<Probe />)

    expect(held.scheduler).toBeNull()
  })
})

describe('FramerMotion', () => {
  const entrance = {
    engine: 'motion',
    variants: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
    transition: { duration: 240 },
    listeners: [{ event: 'inView', variant: 'visible' }],
  } as const

  it('starts at the first variant and animates towards the one the trigger names', () => {
    render(
      <FramerMotion resolved={entrance}>
        <span>section</span>
      </FramerMotion>,
    )

    const wrapper = screen.getByText('section').parentElement

    expect(wrapper?.style.opacity).toBe('0')
  })

  it('holds the end state when it is not active, which is what a pause looks like', () => {
    render(
      <FramerMotion active={false} resolved={entrance}>
        <span>section</span>
      </FramerMotion>,
    )

    const wrapper = screen.getByText('section').parentElement

    expect(wrapper?.style.opacity).toBe('1')
  })
})

describe('settledVariant', () => {
  it('holds an entrance at its visible state and an exit at the one before it leaves', () => {
    expect(settledVariant({ hidden: {}, visible: {} })).toBe('visible')
    expect(settledVariant({ visible: {}, exit: {} })).toBe('visible')
    expect(settledVariant({ rest: {}, hover: {} })).toBe('rest')
    expect(settledVariant({ start: {}, end: {} })).toBe('end')
    expect(settledVariant(undefined)).toBeUndefined()
  })

  it('keeps a capped exit on screen rather than rendering it gone', () => {
    render(
      <FramerMotion
        active={false}
        resolved={{ engine: 'motion', variants: { visible: { opacity: 1 }, exit: { opacity: 0 } } }}
      >
        <span>card</span>
      </FramerMotion>,
    )

    expect(screen.getByText('card').parentElement?.style.opacity).toBe('1')
  })
})

describe('CssMotion drives a scrubbed timeline', () => {
  /** ADR-349: the scrub is one custom property, and this is the wire the bus writes it through. */
  const scrub = {
    engine: 'css',
    className: 'ms-scroll-timeline-test',
    properties: ['transform'],
    cssVars: { '--ms-scroll-progress': '0' },
    transition: { duration: 0 },
    listeners: [{ event: 'scroll', variant: 'end' }],
    keyframes:
      '@keyframes ms-scroll-timeline-test { 0% { opacity: 0 } } .ms-scroll-timeline-test { animation: ms-scroll-timeline-test 1s linear paused both; animation-delay: calc(-1s * var(--ms-scroll-progress, 0)) }',
  } as const

  it('writes the scroll progress the paused animation is seeked by', () => {
    const frames: ((time: number) => void)[] = []

    vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) =>
      frames.push(callback),
    )
    vi.stubGlobal('cancelAnimationFrame', () => undefined)

    const { scrollSource, state } = source()

    render(
      <MotionSchedulerProvider source={scrollSource}>
        <CssMotion resolved={scrub}>
          <span>timeline</span>
        </CssMotion>
      </MotionSchedulerProvider>,
    )

    const wrapper = screen.getByText('timeline').parentElement

    expect(wrapper?.style.getPropertyValue('--ms-scroll-progress')).toBe('0')

    state.offset = 500

    act(() => {
      state.listener?.()

      for (const frame of [...frames]) {
        frame(16)
      }
    })

    expect(wrapper?.style.getPropertyValue('--ms-scroll-progress')).toBe('0.5')
  })

  it('emits its keyframes beside the element and stops subscribing when it is inactive', () => {
    const { scrollSource, state } = source()

    render(
      <MotionSchedulerProvider source={scrollSource}>
        <CssMotion active={false} resolved={scrub}>
          <span>paused</span>
        </CssMotion>
      </MotionSchedulerProvider>,
    )

    const wrapper = screen.getByText('paused').parentElement

    expect(wrapper?.querySelector('style')?.textContent).toContain('animation-delay')
    expect(wrapper?.style.animationPlayState).toBe('paused')
    // Nothing subscribed, so nothing attached a listener to the source.
    expect(state.listener).toBeNull()
  })
})

describe('MotionNode and the caps', () => {
  it('renders the fourth gpu-heavy instance in its static end state', async () => {
    const { scrollSource } = source()

    const Heavy = () => (
      <MotionNode motion={{ scroll: spec('parallax', 'scroll') }} presets={registry} scale={1}>
        <span>heavy</span>
      </MotionNode>
    )

    render(
      <MotionSchedulerProvider source={scrollSource}>
        <Heavy />
        <Heavy />
        <Heavy />
        <Heavy />
      </MotionSchedulerProvider>,
    )

    // Exactly one of the four is held at its end state; the other three animate, so they carry no
    // static transform of their own. Which one is capped is the scheduler's business, not the test's.
    await waitFor(() => {
      const held = screen
        .getAllByText('heavy')
        .map((child) => child.parentElement?.style.transform)
        .filter((transform) => transform === 'translateY(-80px)')

      expect(held).toHaveLength(1)
    })
  })
})
