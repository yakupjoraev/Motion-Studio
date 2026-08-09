import { nodeId } from '@motion-studio/schema'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRectCache, useRectCacheContext } from './use-rect-cache'

const ID = nodeId('node_hero')

const box = (x: number) => ({ x, y: 0, width: 100, height: 40 }) as DOMRect

const frame = () =>
  act(() => {
    vi.advanceTimersToNextFrame()
  })

/** The scene, as the cache sees it: a version and a way to hear that it moved — ADR-112. */
const fakeScene = () => {
  const listeners = new Set<() => void>()
  let version = 1

  return {
    scene: {
      version: () => version,
      subscribe: (listener: () => void) => {
        listeners.add(listener)

        return () => {
          listeners.delete(listener)
        }
      },
    },
    bump() {
      version += 1

      for (const listener of listeners) {
        listener()
      }
    },
    notify() {
      for (const listener of listeners) {
        listener()
      }
    },
  }
}

const mount = () => {
  const root = document.createElement('div')
  const node = document.createElement('div')

  node.getBoundingClientRect = vi.fn(() => box(10))
  root.append(node)
  document.body.append(root)

  const held = fakeScene()
  const view = renderHook(() => useRectCache({ rootRef: { current: root }, scene: held.scene }))

  return { ...view, ...held, root, node }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  document.body.replaceChildren()
})

describe('useRectCacheContext', () => {
  it('throws outside the canvas rather than handing back a cache nobody feeds', () => {
    expect(() => renderHook(() => useRectCacheContext())).toThrow(
      'useRectCacheContext must be used inside the Canvas',
    )
  })
})

describe('useRectCache', () => {
  it('holds a rect once the frame has run', () => {
    const { result, node } = mount()

    act(() => {
      result.current.observe(ID, node)
    })
    frame()

    expect(result.current.get(ID)).toEqual(box(10))
  })

  it('drops what it holds when the document version changes, and reads again', () => {
    const { result, node, bump } = mount()

    act(() => {
      result.current.observe(ID, node)
    })
    frame()

    node.getBoundingClientRect = vi.fn(() => box(400))

    act(() => bump())

    expect(result.current.get(ID)).toBeUndefined()

    frame()

    expect(result.current.get(ID)).toEqual(box(400))
  })

  it('ignores a notification the version did not change — a selection is not a layout', () => {
    const { result, node, notify } = mount()

    act(() => {
      result.current.observe(ID, node)
    })
    frame()

    node.getBoundingClientRect = vi.fn(() => box(400))

    act(() => notify())

    // Still the rect it measured: re-reading 200 nodes because something was clicked is the cost
    // the version comparison exists to avoid.
    expect(result.current.get(ID)).toEqual(box(10))
  })

  it('re-reads on a scroll below the canvas root, which no ResizeObserver would report', () => {
    const { result, node, root } = mount()

    act(() => {
      result.current.observe(ID, node)
    })
    frame()

    node.getBoundingClientRect = vi.fn(() => box(400))

    act(() => {
      node.dispatchEvent(new Event('scroll', { bubbles: false }))
    })
    frame()

    expect(result.current.get(ID)).toEqual(box(400))
    expect(root.isConnected).toBe(true)
  })

  it('lets go of the observer when the canvas unmounts', () => {
    const { result, node, unmount } = mount()

    act(() => {
      result.current.observe(ID, node)
    })
    frame()
    unmount()

    expect(result.current.get(ID)).toBeUndefined()
  })
})
