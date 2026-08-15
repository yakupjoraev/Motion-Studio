import { afterEach, describe, expect, it, vi } from 'vitest'

import { CONTINUOUS_CAP, GPU_HEAVY_CAP, createCapPool } from './caps'
import { createFrameLoop } from './frame-loop'
import { THRESHOLD_BUCKETS, bucketFor, createIntersectionPool } from './intersection-pool'
import { createPointerBus } from './pointer-bus'
import { type ScrollSource, createScrollBus } from './scroll-bus'

/** Every observer this module ever constructed, so a test can count them. */
const observers: { threshold: unknown; targets: Element[] }[] = []

class ObserverStub {
  readonly targets: Element[] = []

  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly init?: IntersectionObserverInit,
  ) {
    observers.push({ threshold: init?.threshold, targets: this.targets })
  }

  observe(target: Element): void {
    this.targets.push(target)
  }

  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

const element = (): Element => ({ nodeType: 1 }) as unknown as Element

afterEach(() => {
  observers.length = 0
  vi.unstubAllGlobals()
})

describe('bucketFor', () => {
  it('rounds to the nearest of the six buckets', () => {
    expect(bucketFor(0.3)).toBe(0.25)
    expect(bucketFor(0.04)).toBe(0)
    expect(bucketFor(0.9)).toBe(1)
    expect(bucketFor(-2)).toBe(0)
    expect(bucketFor(7)).toBe(1)
  })
})

describe('createIntersectionPool', () => {
  it('keeps one observer per bucket for fifty consumers across six thresholds', () => {
    vi.stubGlobal('IntersectionObserver', ObserverStub)

    const pool = createIntersectionPool()

    for (let index = 0; index < 50; index += 1) {
      const threshold = THRESHOLD_BUCKETS[index % THRESHOLD_BUCKETS.length] ?? 0

      pool.observe(element(), () => undefined, threshold)
    }

    expect(pool.observerCount).toBe(6)
    expect(observers).toHaveLength(6)
    expect(observers.map((observer) => observer.threshold).sort()).toEqual([...THRESHOLD_BUCKETS])
  })

  it('reports visibility to every consumer of the element and remembers the answer', () => {
    const held: { notify: IntersectionObserverCallback | null } = { notify: null }

    vi.stubGlobal(
      'IntersectionObserver',
      class extends ObserverStub {
        constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
          super(callback, init)
          held.notify = callback
        }
      },
    )

    const pool = createIntersectionPool()
    const target = element()
    const seen: boolean[] = []

    pool.observe(target, (visible) => seen.push(visible), 0.25)
    pool.observe(target, (visible) => seen.push(visible), 0.25)

    expect(pool.isVisible(target)).toBe(true)

    held.notify?.(
      [{ target, isIntersecting: false, intersectionRatio: 0 } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )

    expect(seen).toEqual([false, false])
    expect(pool.isVisible(target)).toBe(false)
  })

  it('does nothing but stay quiet where there is no observer at all', () => {
    vi.stubGlobal('IntersectionObserver', undefined)

    const pool = createIntersectionPool()
    const stop = pool.observe(element(), () => undefined)

    expect(pool.observerCount).toBe(0)
    expect(() => stop()).not.toThrow()
  })
})

/** A source that counts how many times its metrics were read — "computed once" is a number. */
const countingSource = () => {
  const state = { reads: 0, offset: 0, listener: null as null | (() => void) }

  const source: ScrollSource = {
    addEventListener: (_type, listener) => {
      state.listener = listener
    },
    removeEventListener: () => {
      state.listener = null
    },
    metrics: () => {
      state.reads += 1

      return { offset: state.offset, max: 1000 }
    },
  }

  return { source, state }
}

describe('createScrollBus', () => {
  it('computes progress once per frame however many events and subscribers there are', () => {
    const { source, state } = countingSource()
    const frames: (() => void)[] = []
    const schedule = vi.fn((callback: () => void) => {
      frames.push(callback)

      return frames.length
    })

    const bus = createScrollBus({ source, schedule })
    const received: number[] = []

    for (let index = 0; index < 100; index += 1) {
      bus.subscribe((progress) => received.push(progress.progress))
    }

    state.offset = 250

    for (let index = 0; index < 10; index += 1) {
      state.listener?.()
    }

    expect(schedule).toHaveBeenCalledTimes(1)

    frames[0]?.()

    expect(state.reads).toBe(1)
    expect(received).toHaveLength(100)
    expect(received.every((progress) => progress === 0.25)).toBe(true)
  })

  it('reports velocity between frames and clamps the progress', () => {
    const { source, state } = countingSource()
    const frames: (() => void)[] = []
    const bus = createScrollBus({
      source,
      schedule: (callback) => frames.push(callback),
    })

    const seen: { progress: number; velocity: number }[] = []

    bus.subscribe((progress) => seen.push(progress))

    state.offset = 400
    state.listener?.()
    frames.shift()?.()

    state.offset = 4000
    state.listener?.()
    frames.shift()?.()

    expect(seen[0]).toMatchObject({ progress: 0.4, velocity: 400 })
    expect(seen[1]).toMatchObject({ progress: 1, velocity: 3600 })
  })

  it('holds no listener until someone subscribes, and none after the last leaves', () => {
    const { source, state } = countingSource()
    const bus = createScrollBus({ source, schedule: () => 1 })

    expect(state.listener).toBeNull()

    const stop = bus.subscribe(() => undefined)

    expect(state.listener).not.toBeNull()

    stop()

    expect(state.listener).toBeNull()
  })

  it('lets go of its listener and its frame when destroyed', () => {
    const { source, state } = countingSource()
    const cancel = vi.fn()
    const bus = createScrollBus({ source, schedule: () => 7, cancel })

    bus.subscribe(() => undefined)
    state.listener?.()
    bus.destroy()

    expect(cancel).toHaveBeenCalledWith(7)
    expect(state.listener).toBeNull()
  })
})

describe('createPointerBus', () => {
  it('opens one listener and distributes the latest point once per frame', () => {
    const listeners = new Map<string, EventListener>()
    const frames: (() => void)[] = []
    const target = {
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener)
      }),
      removeEventListener: vi.fn((type: string) => {
        listeners.delete(type)
      }),
    } as unknown as Document

    const bus = createPointerBus({ target, schedule: (callback) => frames.push(callback) })
    const points: { x: number; y: number }[] = []

    bus.subscribe((point) => points.push(point))
    bus.subscribe((point) => points.push(point))

    listeners.get('pointermove')?.({ clientX: 10, clientY: 20 } as unknown as Event)
    listeners.get('pointermove')?.({ clientX: 30, clientY: 40 } as unknown as Event)

    expect(frames).toHaveLength(1)

    frames[0]?.()

    expect(points).toEqual([
      { x: 30, y: 40 },
      { x: 30, y: 40 },
    ])

    bus.destroy()

    expect(listeners.size).toBe(0)
  })
})

/** A `document` the loop can be told to hide, with the listener it registers. */
const fakeDocument = () => {
  const listeners = new Set<() => void>()
  const state = { hidden: false }

  return {
    state,
    hide(hidden: boolean) {
      state.hidden = hidden

      for (const listener of listeners) {
        listener()
      }
    },
    view: {
      get hidden() {
        return state.hidden
      },
      addEventListener: (_type: string, listener: () => void) => {
        listeners.add(listener)
      },
      removeEventListener: (_type: string, listener: () => void) => {
        listeners.delete(listener)
      },
    } as unknown as Document,
  }
}

describe('createFrameLoop', () => {
  it('runs while something is registered and cancels its frame when the last one leaves', () => {
    const frames: ((time: number) => void)[] = []
    const cancel = vi.fn()
    const loop = createFrameLoop({
      schedule: (callback) => frames.push(callback),
      cancel,
    })

    expect(loop.running).toBe(false)

    const stop = loop.add(() => undefined)

    expect(loop.running).toBe(true)

    stop()

    expect(cancel).toHaveBeenCalledTimes(1)
    expect(loop.running).toBe(false)

    // And no further frame is requested by a tick that has nothing to tick.
    const before = frames.length

    frames.at(-1)?.(16)

    expect(frames.length).toBe(before)
  })

  it('passes the time since the previous frame', () => {
    const frames: ((time: number) => void)[] = []
    const loop = createFrameLoop({ schedule: (callback) => frames.push(callback) })
    const deltas: number[] = []

    loop.add((dt) => deltas.push(dt))

    frames.shift()?.(1000)
    frames.shift()?.(1016)

    expect(deltas).toEqual([0, 16])
  })

  it('skips a callback whose element is off screen', () => {
    const frames: ((time: number) => void)[] = []
    const visible = new Map<Element, boolean>()
    const loop = createFrameLoop({
      schedule: (callback) => frames.push(callback),
      isVisible: (element_) => visible.get(element_) ?? true,
    })

    const onScreen = element()
    const offScreen = element()

    visible.set(onScreen, true)
    visible.set(offScreen, false)

    const ticks: string[] = []

    loop.add(() => ticks.push('on'), onScreen)
    loop.add(() => ticks.push('off'), offScreen)
    loop.add(() => ticks.push('free'))

    frames.shift()?.(0)

    expect(ticks).toEqual(['on', 'free'])
  })

  it('stops while the tab is hidden and picks up again when it comes back', () => {
    const frames: ((time: number) => void)[] = []
    const cancel = vi.fn()
    const view = fakeDocument()
    const loop = createFrameLoop({
      schedule: (callback) => frames.push(callback),
      cancel,
      document: view.view,
    })

    loop.add(() => undefined)

    expect(loop.running).toBe(true)

    view.hide(true)

    expect(loop.running).toBe(false)
    expect(cancel).toHaveBeenCalled()

    view.hide(false)

    expect(loop.running).toBe(true)
  })

  it('freezes on pause and resumes without a jump in `dt` — ADR-100', () => {
    const frames: ((time: number) => void)[] = []
    const loop = createFrameLoop({ schedule: (callback) => frames.push(callback) })
    const deltas: number[] = []

    loop.add((dt) => deltas.push(dt))
    frames.shift()?.(1000)

    loop.setPaused(true)

    expect(loop.running).toBe(false)
    expect(loop.paused).toBe(true)

    loop.setPaused(false)
    frames.shift()?.(9000)

    expect(deltas).toEqual([0, 0])
  })
})

describe('createCapPool', () => {
  it('animates the first three gpu-heavy instances and leaves the rest static', () => {
    const pool = createCapPool()
    const ids = ['a', 'b', 'c', 'd', 'e']

    for (const id of ids) {
      pool.register(id, 'gpuHeavy')
    }

    expect(ids.filter((id) => pool.isAnimating(id))).toEqual(ids.slice(0, GPU_HEAVY_CAP))
    expect(pool.isAnimating('d')).toBe(false)
    expect(pool.isAnimating('e')).toBe(false)
  })

  it('caps continuous instances at six', () => {
    const pool = createCapPool()
    const ids = Array.from({ length: CONTINUOUS_CAP + 2 }, (_, index) => `c${index}`)

    for (const id of ids) {
      pool.register(id, 'continuous')
    }

    expect(ids.filter((id) => pool.isAnimating(id))).toHaveLength(CONTINUOUS_CAP)
    expect(pool.isAnimating(`c${CONTINUOUS_CAP}`)).toBe(false)
  })

  it('counts the caps per kind, not across them', () => {
    const pool = createCapPool()

    pool.register('heavy', 'gpuHeavy')
    pool.register('loop', 'continuous')

    expect(pool.isAnimating('heavy')).toBe(true)
    expect(pool.isAnimating('loop')).toBe(true)
  })

  it('hands the claim on when an instance scrolls out of the viewport', () => {
    const pool = createCapPool()
    const changes: number[] = []

    pool.subscribe(() => changes.push(1))

    for (const id of ['a', 'b', 'c', 'd']) {
      pool.register(id, 'gpuHeavy')
    }

    expect(pool.isAnimating('d')).toBe(false)

    pool.setVisible('a', false)

    expect(pool.isAnimating('a')).toBe(false)
    expect(pool.isAnimating('d')).toBe(true)
    expect(changes.length).toBeGreaterThan(0)
  })

  it('releases the claim when an instance unmounts', () => {
    const pool = createCapPool()
    const stop = pool.register('a', 'gpuHeavy')

    for (const id of ['b', 'c', 'd']) {
      pool.register(id, 'gpuHeavy')
    }

    expect(pool.isAnimating('d')).toBe(false)

    stop()

    expect(pool.isAnimating('d')).toBe(true)
  })
})
