import type { NodeId } from '@motion-studio/schema'

import { type ScreenRect, screenRect } from '../coords/index'

/**
 * CANVAS.md § Hit testing. Every overlay and the marquee read node geometry from here, so that a
 * gesture over 200 nodes performs no layout at all: `get` is a map read — ADR-079 — and the map is
 * filled by one batched pass per frame.
 */
export interface RectCache {
  get(id: NodeId): ScreenRect | undefined
  invalidate(id?: NodeId): void
  /** Schedules the batched pass. Calling it ten times in a frame still reads layout once. */
  refresh(): void
  /** Returns the un-observe, which is what a node wrapper runs on unmount. */
  observe(id: NodeId, element: Element): () => void
  /**
   * Called at the end of each batched pass. An overlay converts a rect with the transform that was
   * in effect when it was measured (ADR-091), so it has to learn about the pass rather than poll.
   */
  subscribe(listener: () => void): () => void
}

export interface OwnedRectCache extends RectCache {
  /** Drops the observer and the map. The next `observe` builds a fresh observer. */
  dispose(): void
}

export interface RectCacheOptions {
  /** Injected so a test can drive frames by hand; the default is the real frame. */
  readonly schedule?: ((callback: () => void) => number) | undefined
  readonly cancel?: ((handle: number) => void) | undefined
  /** Returns `null` where there is no `ResizeObserver` — jsdom, and any server render. */
  readonly createObserver?:
    | ((callback: ResizeObserverCallback) => ResizeObserver | null)
    | undefined
}

const defaultCreateObserver = (callback: ResizeObserverCallback): ResizeObserver | null =>
  typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(callback)

/**
 * One `ResizeObserver` for every node, not one per node: fifty observers cost fifty callbacks and
 * fifty registrations for an answer that is the same single question — "did anything change size".
 *
 * The observer's entries are deliberately ignored. A node that resizes moves its siblings, so the
 * correct response to any resize is to re-read the whole set, and re-reading the whole set is one
 * batched pass either way.
 */
export function createRectCache(options: RectCacheOptions = {}): OwnedRectCache {
  const schedule = options.schedule ?? requestAnimationFrame
  const cancel = options.cancel ?? cancelAnimationFrame
  const createObserver = options.createObserver ?? defaultCreateObserver

  const elements = new Map<NodeId, Element>()
  const rects = new Map<NodeId, ScreenRect>()
  const listeners = new Set<() => void>()

  let frame: number | null = null
  let observer: ResizeObserver | null = null
  let observerBuilt = false

  const read = (): void => {
    frame = null

    for (const [id, element] of elements) {
      rects.set(id, screenRect(element.getBoundingClientRect()))
    }

    for (const listener of listeners) {
      listener()
    }
  }

  const refresh = (): void => {
    if (frame !== null) {
      return
    }

    frame = schedule(read)
  }

  return {
    get: (id) => rects.get(id),

    invalidate(id) {
      if (id === undefined) {
        rects.clear()

        return
      }

      rects.delete(id)
    },

    refresh,

    observe(id, element) {
      if (!observerBuilt) {
        observerBuilt = true
        observer = createObserver(refresh)
      }

      elements.set(id, element)
      observer?.observe(element)
      // A node that has just mounted has no rect yet, and the marquee that is already running would
      // otherwise not see it until something else asked for a pass.
      refresh()

      return () => {
        elements.delete(id)
        rects.delete(id)
        observer?.unobserve(element)
      }
    },

    subscribe(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },

    dispose() {
      if (frame !== null) {
        cancel(frame)
        frame = null
      }

      observer?.disconnect()
      observer = null
      observerBuilt = false
      elements.clear()
      rects.clear()
      listeners.clear()
    },
  }
}
