import type { Point } from '@motion-studio/utils'
import { renderHook } from '@testing-library/react'
import { type RefObject, createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { nodeId } from '@motion-studio/schema'
import type { NodeId } from '@motion-studio/schema'

import { AUTO_PAN_MAX_SPEED_PX, useAutoPan } from './use-auto-pan'
import { useAutoScroll } from './use-auto-scroll'
import { SPRING_OPEN_MS, useSpringOpen } from './use-spring-open'

/** A frame queue driven by hand: one entry per scheduled frame, run when the test says so. */
function frameQueue() {
  const queue: (() => void)[] = []

  return {
    schedule: (callback: () => void) => {
      queue.push(callback)

      return queue.length
    },
    cancel: vi.fn(),
    /** Runs exactly one frame, which is what a loop that reschedules itself needs. */
    tick: (times = 1) => {
      for (let index = 0; index < times; index += 1) {
        const next = queue.shift()

        next?.()
      }
    },
    get pending() {
      return queue.length
    },
  }
}

function boxRef(rect: {
  left: number
  top: number
  right: number
  bottom: number
}): RefObject<HTMLElement | null> {
  const element = document.createElement('div')

  element.getBoundingClientRect = () =>
    ({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect

  const ref = createRef<HTMLElement | null>() as { current: HTMLElement | null }
  ref.current = element

  return ref
}

afterEach(() => {
  vi.useRealTimers()
})

describe('useAutoPan', () => {
  const render = (point: () => Point | null, active = true) => {
    const frames = frameQueue()
    const pan = vi.fn()
    const rootRef = boxRef({ left: 0, top: 0, right: 1000, bottom: 800 })
    const view = renderHook(() =>
      useAutoPan({ rootRef, point, pan, active, schedule: frames.schedule, cancel: frames.cancel }),
    )

    return { frames, pan, view }
  }

  it('pans when the pointer is at the edge', () => {
    const { frames, pan } = render(() => ({ x: 0, y: 400 }))

    frames.tick()

    expect(pan).toHaveBeenCalledWith(-AUTO_PAN_MAX_SPEED_PX, 0)
  })

  it('does nothing in the middle, and still asks for the next frame', () => {
    const { frames, pan } = render(() => ({ x: 500, y: 400 }))

    frames.tick()

    expect(pan).not.toHaveBeenCalled()
    expect(frames.pending).toBe(1)
  })

  it('keeps panning frame after frame', () => {
    const { frames, pan } = render(() => ({ x: 10, y: 400 }))

    frames.tick(3)

    expect(pan).toHaveBeenCalledTimes(3)
  })

  it('does not start a loop when no drag is in flight', () => {
    const { frames, pan } = render(() => ({ x: 0, y: 0 }), false)

    expect(frames.pending).toBe(0)
    expect(pan).not.toHaveBeenCalled()
  })

  it('stops when the drag ends', () => {
    const { frames, view } = render(() => ({ x: 0, y: 400 }))

    view.unmount()

    expect(frames.cancel).toHaveBeenCalled()
  })

  it('does nothing while the canvas element is not mounted', () => {
    const frames = frameQueue()
    const pan = vi.fn()
    const empty = createRef<HTMLElement | null>() as { current: HTMLElement | null }

    renderHook(() =>
      useAutoPan({
        rootRef: empty,
        point: () => ({ x: 0, y: 0 }),
        pan,
        active: true,
        schedule: frames.schedule,
        cancel: frames.cancel,
      }),
    )
    frames.tick()

    expect(pan).not.toHaveBeenCalled()
    expect(frames.pending).toBe(1)
  })

  it('waits for a point before it moves anything', () => {
    const { frames, pan } = render(() => null)

    frames.tick()

    expect(pan).not.toHaveBeenCalled()
  })
})

describe('useAutoScroll', () => {
  it('scrolls the tree when the pointer nears its bottom edge', () => {
    const frames = frameQueue()
    const scrollRef = boxRef({ left: 0, top: 0, right: 300, bottom: 600 })
    const element = scrollRef.current as HTMLElement

    element.scrollTop = 100
    renderHook(() =>
      useAutoScroll({
        scrollRef,
        point: () => ({ x: 150, y: 600 }),
        active: true,
        schedule: frames.schedule,
        cancel: frames.cancel,
      }),
    )

    frames.tick()

    expect(element.scrollTop).toBeGreaterThan(100)
  })

  it('leaves the scroll alone away from the edges', () => {
    const frames = frameQueue()
    const scrollRef = boxRef({ left: 0, top: 0, right: 300, bottom: 600 })
    const element = scrollRef.current as HTMLElement

    element.scrollTop = 100
    renderHook(() =>
      useAutoScroll({
        scrollRef,
        point: () => ({ x: 150, y: 300 }),
        active: true,
        schedule: frames.schedule,
        cancel: frames.cancel,
      }),
    )

    frames.tick()

    expect(element.scrollTop).toBe(100)
  })

  it('does not run while nothing is being dragged', () => {
    const frames = frameQueue()

    renderHook(() =>
      useAutoScroll({
        scrollRef: boxRef({ left: 0, top: 0, right: 300, bottom: 600 }),
        point: () => ({ x: 150, y: 600 }),
        active: false,
        schedule: frames.schedule,
        cancel: frames.cancel,
      }),
    )

    expect(frames.pending).toBe(0)
  })
})

describe('useSpringOpen', () => {
  const GROUP = nodeId('node_group')

  it('opens the group the drag has been holding still over', () => {
    vi.useFakeTimers()
    const open = vi.fn()

    renderHook(() => useSpringOpen({ over: GROUP, open }))
    vi.advanceTimersByTime(SPRING_OPEN_MS - 1)
    expect(open).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(open).toHaveBeenCalledWith(GROUP)
  })

  it('forgets the group as soon as the pointer leaves it', () => {
    vi.useFakeTimers()
    const open = vi.fn()
    const initial: { over: NodeId | null } = { over: GROUP }
    const view = renderHook((props: { over: NodeId | null }) => useSpringOpen({ ...props, open }), {
      initialProps: initial,
    })

    vi.advanceTimersByTime(400)
    view.rerender({ over: null })
    vi.advanceTimersByTime(SPRING_OPEN_MS)

    expect(open).not.toHaveBeenCalled()
  })

  it('starts the wait again for the next group', () => {
    vi.useFakeTimers()
    const open = vi.fn()
    const other = nodeId('node_other')
    const initial: { over: NodeId | null } = { over: GROUP }
    const view = renderHook((props: { over: NodeId | null }) => useSpringOpen({ ...props, open }), {
      initialProps: initial,
    })

    vi.advanceTimersByTime(500)
    view.rerender({ over: other })
    vi.advanceTimersByTime(500)
    expect(open).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(open).toHaveBeenCalledWith(other)
  })
})
