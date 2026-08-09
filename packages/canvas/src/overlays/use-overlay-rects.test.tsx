import { type NodeId, nodeId } from '@motion-studio/schema'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type ScreenRect, screenRect } from '../coords/index'
import type { RectCache } from '../rects/rect-cache'
import { IDENTITY, useViewport } from '../viewport/use-viewport'

import type { OverlayFrame } from './overlay.types'
import { useOverlayRects } from './use-overlay-rects'

const HERO = nodeId('node_hero')

const fakeCache = (rects: Record<string, ScreenRect> = {}) => {
  const listeners = new Set<() => void>()

  const cache: RectCache = {
    get: (id) => rects[id],
    invalidate: () => undefined,
    refresh: () => undefined,
    observe: () => () => undefined,
    subscribe: (listener) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }

  return {
    cache,
    read: (next?: Record<string, ScreenRect>) => {
      Object.assign(rects, next ?? {})

      for (const listener of listeners) {
        listener()
      }
    },
  }
}

const setup = (rects: Record<string, ScreenRect> = {}) => {
  const held = fakeCache(rects)
  const view = renderHook(() => {
    const viewport = useViewport({ initial: IDENTITY })

    return { viewport, painter: useOverlayRects({ viewport, cache: held.cache }) }
  })

  // The viewport writes its variables on the root and only then tells its listeners, so a hook with
  // no element attached never reaches the frame under test.
  act(() => {
    view.result.current.viewport.rootRef.current = document.createElement('div')
  })

  return { ...held, view }
}

const frame = (): void => {
  act(() => {
    vi.advanceTimersToNextFrame()
  })
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useOverlayRects', () => {
  it('calls every registered overlay once per frame, from one loop', () => {
    const { view } = setup()
    const first = vi.fn()
    const second = vi.fn()

    act(() => {
      view.result.current.painter.register(first)
      view.result.current.painter.register(second)
      view.result.current.painter.schedule()
      view.result.current.painter.schedule()
      view.result.current.painter.schedule()
    })

    frame()

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('hands out the node box in canvas units', () => {
    const { view, read } = setup({
      [HERO]: screenRect({ x: 100, y: 50, width: 200, height: 80 }),
    })

    let seen: OverlayFrame | null = null

    act(() => {
      view.result.current.painter.register((one) => {
        seen = one
      })
    })

    act(() => read())
    frame()

    expect(seen).not.toBeNull()
    expect((seen as unknown as OverlayFrame).rect(HERO)).toMatchObject({
      x: 100,
      y: 50,
      width: 200,
      height: 80,
    })
  })

  it('marks the frame after a cache pass dirty, and the one after a pan not', () => {
    const { view, read } = setup()
    const seen: boolean[] = []

    act(() => {
      view.result.current.painter.register((one) => {
        seen.push(one.dirty)
      })
    })

    act(() => read())
    frame()
    act(() => {
      view.result.current.painter.schedule()
    })
    frame()

    expect(seen).toEqual([true, false])
  })

  it('converts with the transform the rect was measured under, not the one after the pan', () => {
    const { view, read } = setup()
    const boxes: Array<{ x: number; y: number } | undefined> = []

    act(() => {
      view.result.current.painter.register((one) => {
        const rect = one.rect(HERO)

        boxes.push(rect === undefined ? undefined : { x: rect.x, y: rect.y })
      })
    })

    act(() => read({ [HERO]: screenRect({ x: 100, y: 100, width: 10, height: 10 }) }))
    frame()

    // A pan after the measurement must not move the box the overlay holds: it is canvas units.
    act(() => {
      view.result.current.viewport.panBy(80, 40)
    })
    // One frame writes the transform and notifies; the paint the notification schedules is the next.
    frame()
    frame()

    expect(boxes).toEqual([
      { x: 100, y: 100 },
      { x: 100, y: 100 },
    ])
  })

  it('reports nothing for a node the cache has never measured', () => {
    const { view, read } = setup()
    let missing: unknown = 'unset'

    act(() => {
      view.result.current.painter.register((one) => {
        missing = one.rect(nodeId('node_ghost') as NodeId)
      })
    })

    act(() => read())
    frame()

    expect(missing).toBeUndefined()
  })

  it('drops an overlay that unregisters, and cancels its frame on unmount', () => {
    const { view } = setup()
    const paint = vi.fn()

    act(() => {
      const stop = view.result.current.painter.register(paint)

      stop()
      view.result.current.painter.schedule()
    })

    frame()

    expect(paint).not.toHaveBeenCalled()
    expect(() => view.unmount()).not.toThrow()
  })
})
