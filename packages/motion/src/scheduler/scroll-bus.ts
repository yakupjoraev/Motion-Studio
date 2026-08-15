import type { ScrollProgress, Unsubscribe } from './scheduler.types'

/**
 * What the bus needs from whatever is scrolling. A window and an element answer the same two
 * questions differently, and a test answers them without a DOM at all.
 */
export interface ScrollSource {
  addEventListener(type: 'scroll', listener: () => void, options: { passive: true }): void
  removeEventListener(type: 'scroll', listener: () => void): void
  /** Read once per frame, never once per subscriber. */
  metrics(): { readonly offset: number; readonly max: number }
}

export const windowScrollSource = (view: Window = window): ScrollSource => ({
  addEventListener: (type, listener, options) => view.addEventListener(type, listener, options),
  removeEventListener: (type, listener) => view.removeEventListener(type, listener),
  metrics: () => {
    const document_ = view.document.documentElement

    return { offset: view.scrollY, max: document_.scrollHeight - view.innerHeight }
  },
})

export const elementScrollSource = (element: HTMLElement): ScrollSource => ({
  addEventListener: (type, listener, options) => element.addEventListener(type, listener, options),
  removeEventListener: (type, listener) => element.removeEventListener(type, listener),
  metrics: () => ({
    offset: element.scrollTop,
    max: element.scrollHeight - element.clientHeight,
  }),
})

export interface ScrollBus {
  subscribe(callback: (progress: ScrollProgress) => void): Unsubscribe
  destroy(): void
}

export interface ScrollBusOptions {
  readonly source: ScrollSource
  readonly schedule?: (callback: () => void) => number
  readonly cancel?: (handle: number) => void
}

/**
 * One passive listener, whatever the number of subscribers. The event sets a flag; the frame computes
 * the progress **once** and hands the same object to everyone — computing per subscriber inside the
 * handler is the shape that turns ten scroll events into a thousand layout reads.
 */
export function createScrollBus({
  source,
  schedule = (callback) => requestAnimationFrame(callback),
  cancel = (handle) => cancelAnimationFrame(handle),
}: ScrollBusOptions): ScrollBus {
  const subscribers = new Set<(progress: ScrollProgress) => void>()

  let frame: number | null = null
  let previous = 0

  const flush = (): void => {
    frame = null

    const { offset, max } = source.metrics()
    const progress: ScrollProgress = {
      offset,
      progress: max <= 0 ? 0 : Math.min(Math.max(offset / max, 0), 1),
      velocity: offset - previous,
    }

    previous = offset

    for (const subscriber of subscribers) {
      subscriber(progress)
    }
  }

  const onScroll = (): void => {
    if (frame === null) {
      frame = schedule(flush)
    }
  }

  let attached = false

  /**
   * Attached on the first subscriber and released with the last. A bus nobody listens to holds no
   * listener — which is also what keeps a scheduler that a double-invoked render threw away from
   * leaving one behind.
   */
  const attach = (): void => {
    if (!attached) {
      attached = true
      source.addEventListener('scroll', onScroll, { passive: true })
    }
  }

  const detach = (): void => {
    if (attached) {
      attached = false
      source.removeEventListener('scroll', onScroll)
    }
  }

  return {
    subscribe(callback) {
      subscribers.add(callback)
      attach()

      return () => {
        subscribers.delete(callback)

        if (subscribers.size === 0) {
          detach()
        }
      }
    },

    destroy() {
      subscribers.clear()
      detach()

      if (frame !== null) {
        cancel(frame)
        frame = null
      }
    },
  }
}
