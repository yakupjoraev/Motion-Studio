import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearResolutionCache } from '../model/resolve'
import { createScheduler } from '../scheduler/create-scheduler'
import { MotionSchedulerProvider, useScheduler } from '../scheduler/scheduler-context'
import type { ScrollSource } from '../scheduler/scroll-bus'
import { registry, spec } from '../test/presets'

import { FramerMotion, settledVariant } from './framer-motion'
import { GsapMotion } from './gsap-motion'
import { MotionNode } from './motion-node'

const timeline = {
  set: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  progress: vi.fn().mockReturnThis(),
  kill: vi.fn(),
}

const gsapSet = vi.fn()

vi.mock('gsap', () => ({
  gsap: { timeline: () => timeline, set: (...args: unknown[]) => gsapSet(...args) },
}))

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
  gsapSet.mockClear()
  timeline.set.mockClear()
  timeline.to.mockClear()
  timeline.kill.mockClear()
  timeline.progress.mockClear()
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

describe('GsapMotion', () => {
  const scrub = {
    engine: 'gsap',
    variants: { start: { y: 0 }, end: { y: -80 } },
    transition: { duration: 0 },
    listeners: [{ event: 'scroll', variant: 'end' }],
  } as const

  it('loads the library on first use and scrubs the timeline from the shared scroll bus', async () => {
    const frames: ((time: number) => void)[] = []

    vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) =>
      frames.push(callback),
    )
    vi.stubGlobal('cancelAnimationFrame', () => undefined)

    const { scrollSource, state } = source()

    render(
      <MotionSchedulerProvider source={scrollSource}>
        <GsapMotion resolved={scrub}>
          <span>parallax</span>
        </GsapMotion>
      </MotionSchedulerProvider>,
    )

    await waitFor(() => expect(timeline.set).toHaveBeenCalled())

    expect(timeline.set.mock.calls[0]?.[1]).toEqual({ transform: 'translateY(0px)' })
    expect(timeline.to.mock.calls[0]?.[1]).toMatchObject({ transform: 'translateY(-80px)' })

    state.offset = 500

    act(() => {
      state.listener?.()

      for (const frame of [...frames]) {
        frame(16)
      }
    })

    expect(timeline.progress).toHaveBeenCalledWith(0.5)
  })

  it('clears the inline styles it wrote when it stops driving the element', async () => {
    const { scrollSource } = source()
    const view = render(
      <MotionSchedulerProvider source={scrollSource}>
        <GsapMotion resolved={scrub}>
          <span>parallax</span>
        </GsapMotion>
      </MotionSchedulerProvider>,
    )

    await waitFor(() => expect(timeline.set).toHaveBeenCalled())

    view.unmount()

    expect(gsapSet).toHaveBeenCalledWith(expect.anything(), { clearProps: 'all' })
  })

  it('shows the end state and loads nothing while it is inactive', () => {
    render(
      <GsapMotion active={false} resolved={scrub}>
        <span>parallax</span>
      </GsapMotion>,
    )

    expect(screen.getByText('parallax').parentElement?.style.transform).toBe('translateY(-80px)')
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

    const wrappers = screen.getAllByText('heavy').map((child) => child.parentElement)

    await waitFor(() => expect(wrappers[3]?.style.transform).toBe('translateY(-80px)'))

    // The first three animate, so they carry no static transform of their own.
    expect(wrappers[0]?.style.transform).toBe('')
  })
})
