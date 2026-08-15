import type { Point } from '@motion-studio/utils'

import type { Unsubscribe } from './scheduler.types'

export interface PointerBus {
  subscribe(callback: (point: Point) => void): Unsubscribe
  destroy(): void
}

export interface PointerBusOptions {
  readonly target?: Pick<Document, 'addEventListener' | 'removeEventListener'>
  readonly schedule?: (callback: () => void) => number
  readonly cancel?: (handle: number) => void
}

/**
 * One document-level `pointermove`, throttled to a frame. Cursor presets take the point and write CSS
 * variables from it — no React, no store — which is why the cursor channel composes with everything
 * and costs nothing (ANIMATION_SYSTEM.md § The scheduler).
 */
export function createPointerBus({
  target = document,
  schedule = (callback) => requestAnimationFrame(callback),
  cancel = (handle) => cancelAnimationFrame(handle),
}: PointerBusOptions = {}): PointerBus {
  const subscribers = new Set<(point: Point) => void>()

  let frame: number | null = null
  let latest: Point = { x: 0, y: 0 }

  const flush = (): void => {
    frame = null

    for (const subscriber of subscribers) {
      subscriber(latest)
    }
  }

  const onPointerMove = (event: Event): void => {
    const pointer = event as PointerEvent

    latest = { x: pointer.clientX, y: pointer.clientY }

    if (frame === null) {
      frame = schedule(flush)
    }
  }

  let attached = false

  /** Opened by the first cursor preset on the page and closed with the last, as the scroll bus is. */
  const attach = (): void => {
    if (!attached) {
      attached = true
      target.addEventListener('pointermove', onPointerMove, { passive: true })
    }
  }

  const detach = (): void => {
    if (attached) {
      attached = false
      target.removeEventListener('pointermove', onPointerMove)
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
