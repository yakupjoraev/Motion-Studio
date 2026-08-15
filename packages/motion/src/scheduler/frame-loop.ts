import type { FrameCallback, Unsubscribe } from './scheduler.types'

export interface FrameLoop {
  add(callback: FrameCallback, element?: Element): Unsubscribe
  setPaused(paused: boolean): void
  readonly paused: boolean
  readonly running: boolean
  readonly size: number
  destroy(): void
}

export interface FrameLoopOptions {
  /** The intersection pool's answer. An unobserved element counts as visible. */
  readonly isVisible?: (element: Element) => boolean
  readonly schedule?: (callback: (time: number) => void) => number
  readonly cancel?: (handle: number) => void
  readonly document?: Pick<Document, 'addEventListener' | 'removeEventListener' | 'hidden'>
  readonly now?: () => number
}

interface Registration {
  readonly callback: FrameCallback
  readonly element: Element | undefined
}

/**
 * The one `rAF` loop. It runs only while something is registered, it skips callbacks whose element is
 * off screen, and it stops while the tab is hidden — a background tab that keeps ticking is the reason
 * a laptop fan comes on for a page nobody is looking at.
 */
export function createFrameLoop({
  isVisible = () => true,
  schedule = (callback) => requestAnimationFrame(callback),
  cancel = (handle) => cancelAnimationFrame(handle),
  document: view = typeof document === 'undefined' ? undefined : document,
  now = () => (typeof performance === 'undefined' ? Date.now() : performance.now()),
}: FrameLoopOptions = {}): FrameLoop {
  const registrations = new Set<Registration>()

  let frame: number | null = null
  let last = 0
  let paused = false

  const tick = (time: number): void => {
    const timestamp = Number.isFinite(time) ? time : now()
    const dt = last === 0 ? 0 : timestamp - last

    last = timestamp

    for (const registration of registrations) {
      if (registration.element === undefined || isVisible(registration.element)) {
        registration.callback(dt)
      }
    }

    frame = registrations.size > 0 ? schedule(tick) : null
  }

  const stop = (): void => {
    if (frame !== null) {
      cancel(frame)
      frame = null
    }

    // The next start is a fresh clock: a `dt` measured across a hidden tab is a jump, not a frame.
    last = 0
  }

  const start = (): void => {
    if (frame !== null || paused || registrations.size === 0 || view?.hidden === true) {
      return
    }

    frame = schedule(tick)
  }

  const onVisibilityChange = (): void => {
    if (view?.hidden === true) {
      stop()
    } else {
      start()
    }
  }

  view?.addEventListener('visibilitychange', onVisibilityChange)

  return {
    add(callback, element) {
      const registration: Registration = { callback, element }

      registrations.add(registration)
      start()

      return () => {
        registrations.delete(registration)

        if (registrations.size === 0) {
          stop()
        }
      }
    },

    setPaused(next) {
      paused = next

      if (next) {
        stop()
      } else {
        start()
      }
    },

    get paused() {
      return paused
    },

    get running() {
      return frame !== null
    },

    get size() {
      return registrations.size
    },

    destroy() {
      registrations.clear()
      stop()
      view?.removeEventListener('visibilitychange', onVisibilityChange)
    },
  }
}
