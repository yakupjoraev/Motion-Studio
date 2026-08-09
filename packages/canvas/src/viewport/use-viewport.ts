'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'

import {
  type CanvasRect,
  type ScreenPoint,
  type ViewportRect,
  type ViewportTransform,
  clampZoom,
  fitToRect,
  screenPoint,
  zoomAt,
} from '../coords/index'

/**
 * CANVAS.md § DOM structure. The scene reads the first three and the grid the fourth — and so do
 * the overlays, which is why ADR-086 writes them on the canvas root rather than on the scene: a
 * ruler tick and a user guide are outside the transform and still have to follow it.
 */
export const VIEWPORT_VARS = {
  x: '--ms-vp-x',
  y: '--ms-vp-y',
  zoom: '--ms-vp-zoom',
  gridOpacity: '--ms-vp-grid-opacity',
} as const

export const IDENTITY: ViewportTransform = { zoom: 1, pan: { x: 0, y: 0 } }

/** Below this the grid is gone; above the upper bound it is fully opaque — CANVAS.md § Grid. */
export const GRID_FADE_FROM = 0.25
export const GRID_FADE_TO = 0.5

export function gridOpacity(zoom: number): number {
  if (zoom < GRID_FADE_FROM) {
    return 0
  }

  if (zoom >= GRID_FADE_TO) {
    return 1
  }

  return (zoom - GRID_FADE_FROM) / (GRID_FADE_TO - GRID_FADE_FROM)
}

/**
 * A wheel gesture has no `up` event, so it ends when the events stop. 150 ms is the platform's own
 * idea of that: Chrome and Firefox fire `scrollend` after ~100 ms without a wheel event, and the
 * extra 50 ms keeps a slow trackpad flick from being cut into two gestures.
 */
export const WHEEL_IDLE_MS = 150

/** Commits once the wheel has been quiet, so a pinch is one store write rather than sixty. */
export function wheelCommitter(commit: () => void): {
  bump(): void
  cancel(): void
} {
  let timer: ReturnType<typeof setTimeout> | null = null

  return {
    bump() {
      if (timer !== null) {
        clearTimeout(timer)
      }

      timer = setTimeout(() => {
        timer = null
        commit()
      }, WHEEL_IDLE_MS)
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    },
  }
}

export interface ViewportOptions {
  readonly initial?: ViewportTransform | undefined
  /** Called once per gesture, not per frame: this is where the store learns the value. */
  readonly onCommit?: ((transform: ViewportTransform) => void) | undefined
}

export interface ViewportHandle {
  /** The live transform. Read it in a handler; never render from it. */
  readonly current: () => ViewportTransform
  /** The element the CSS variables are written on — the scene. */
  readonly sceneRef: React.RefObject<HTMLDivElement | null>
  /** The element gestures are measured against — the canvas root. */
  readonly rootRef: React.RefObject<HTMLDivElement | null>
  readonly viewportRect: () => ViewportRect
  /**
   * Called after each frame's write, so an overlay that cannot be expressed as `calc()` over the
   * variables — the ruler's choice of tick step — learns about a change without a render per frame.
   */
  subscribe(listener: () => void): () => void
  set(transform: ViewportTransform): void
  panBy(screenDx: number, screenDy: number): void
  zoomBy(factor: number, anchor: ScreenPoint): void
  zoomTo(zoom: number, anchor?: ScreenPoint): void
  fitTo(rect: CanvasRect, maxZoom?: number): void
  /** The centre of the canvas element, which is what a keyboard zoom anchors at. */
  centre(): ScreenPoint
  commit(): void
}

const EMPTY_RECT: ViewportRect = { left: 0, top: 0, width: 0, height: 0 }

/**
 * PERFORMANCE.md § The core rule, applied to the viewport: the transform lives in a ref, every write
 * is coalesced into one `requestAnimationFrame` callback, and the frame writes CSS variables. React
 * renders once per gesture — on `commit` — and never during one.
 */
export function useViewport(options: ViewportOptions = {}): ViewportHandle {
  const transform = useRef<ViewportTransform>(options.initial ?? IDENTITY)
  const frame = useRef<number | null>(null)
  const sceneRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  // Through a ref, so an inline `onCommit` at the call site does not change the handle's identity —
  // the gesture hooks subscribe to it in an effect, and a new handle would re-subscribe mid-drag.
  const onCommit = useRef(options.onCommit)
  const listeners = useRef<Set<() => void>>(new Set())

  onCommit.current = options.onCommit

  const write = useCallback(() => {
    frame.current = null

    const root = rootRef.current

    if (root === null) {
      return
    }

    const { zoom, pan } = transform.current

    root.style.setProperty(VIEWPORT_VARS.x, `${pan.x}px`)
    root.style.setProperty(VIEWPORT_VARS.y, `${pan.y}px`)
    root.style.setProperty(VIEWPORT_VARS.zoom, String(zoom))
    root.style.setProperty(VIEWPORT_VARS.gridOpacity, String(gridOpacity(zoom)))

    for (const listener of listeners.current) {
      listener()
    }
  }, [])

  const schedule = useCallback(() => {
    if (frame.current !== null) {
      return
    }

    frame.current = requestAnimationFrame(write)
  }, [write])

  // The first paint has to show the initial transform, and a mid-gesture unmount must not leave a
  // frame holding a detached element.
  useEffect(() => {
    write()

    return () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current)
        frame.current = null
      }
    }
  }, [write])

  const set = useCallback(
    (next: ViewportTransform) => {
      transform.current = { zoom: clampZoom(next.zoom), pan: { ...next.pan } }

      // PERFORMANCE.md § Layer count: the promotion lasts as long as the gesture and no longer, so
      // an idle studio holds one compositing layer fewer. `commit` is every gesture's end.
      if (sceneRef.current !== null) {
        sceneRef.current.style.willChange = 'transform'
      }

      schedule()
    },
    [schedule],
  )

  const viewportRect = useCallback((): ViewportRect => {
    const root = rootRef.current

    return root === null ? EMPTY_RECT : root.getBoundingClientRect()
  }, [])

  const centre = useCallback((): ScreenPoint => {
    const rect = viewportRect()

    return screenPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
  }, [viewportRect])

  return useMemo<ViewportHandle>(
    () => ({
      current: () => transform.current,
      sceneRef,
      rootRef,
      viewportRect,
      set,
      centre,

      subscribe(listener) {
        listeners.current.add(listener)

        return () => {
          listeners.current.delete(listener)
        }
      },

      /** Screen pixels in, canvas units out: a drag of 10 px moves the scene 10 px at any zoom. */
      panBy(screenDx, screenDy) {
        const { zoom, pan } = transform.current

        set({ zoom, pan: { x: pan.x + screenDx / zoom, y: pan.y + screenDy / zoom } })
      },

      zoomBy(factor, anchor) {
        set(zoomAt(transform.current, factor, anchor, viewportRect()))
      },

      zoomTo(zoom, anchor) {
        const from = transform.current

        set(zoomAt(from, clampZoom(zoom) / from.zoom, anchor ?? centre(), viewportRect()))
      },

      fitTo(rect, maxZoom) {
        set(fitToRect(rect, viewportRect(), maxZoom))
      },

      commit() {
        if (sceneRef.current !== null) {
          sceneRef.current.style.willChange = ''
        }

        onCommit.current?.(transform.current)
      },
    }),
    [centre, set, viewportRect],
  )
}
