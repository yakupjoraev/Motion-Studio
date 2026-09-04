'use client'

import { useEffect, useMemo, useRef } from 'react'

import type { CanvasHandle } from './canvas.types'
import {
  type CanvasRect,
  FIT_PADDING,
  canvasRectToScreen,
  screenRectToCanvas,
} from './coords/index'
import type { OwnedRectCache } from './rects/rect-cache'
import { revealPan } from './viewport/reveal'
import type { ViewportHandle } from './viewport/use-viewport'

export interface CanvasHandleInput {
  readonly documentRect: () => CanvasRect
  readonly cache: OwnedRectCache
  readonly viewport: ViewportHandle
  readonly onReady?: ((handle: CanvasHandle | null) => void) | undefined
}

/**
 * The answers a host needs about measured geometry, and the one place they are assembled. It exists
 * as a hook rather than inline because `nodeRect` is not a getter: it is a two-step conversion with a
 * cache and a transform behind it, and that is a subject of its own.
 */
export function useCanvasHandle({
  documentRect,
  cache,
  viewport,
  onReady,
}: CanvasHandleInput): CanvasHandle {
  /**
   * The transform the cache's rects were measured under — ADR-091 in the other direction. An overlay
   * converts a cached rect to canvas units with the transform of the moment it was read; a host asking
   * "where is this node now" needs the rect converted back out under the *current* one, or every
   * answer is stale by whatever the scene has panned since. Measured: 24 px, which was a drop landing
   * one position off the indicator (ADR-183).
   */
  const measured = useRef({ at: viewport.current(), bounds: viewport.viewportRect() })

  useEffect(
    () =>
      cache.subscribe(() => {
        measured.current = { at: viewport.current(), bounds: viewport.viewportRect() }
      }),
    [cache, viewport],
  )

  const handle = useMemo<CanvasHandle>(
    () => ({
      documentRect,
      viewportRect: viewport.viewportRect,
      nodeRect(id) {
        const screen = cache.get(id)

        if (screen === undefined) {
          return undefined
        }

        const { at, bounds } = measured.current

        return canvasRectToScreen(
          screenRectToCanvas(screen, at, bounds),
          viewport.current(),
          viewport.viewportRect(),
        )
      },
      transform: viewport.current,
      fitDocument: () => viewport.fitTo(documentRect()),
      panBy: (dx, dy) => viewport.panBy(dx, dy),
      remeasure() {
        cache.invalidate()
        cache.refresh()
      },
      reveal(id) {
        const rect = cache.get(id)

        if (rect === undefined) {
          return false
        }

        const { dx, dy } = revealPan(rect, viewport.viewportRect(), FIT_PADDING)

        if (dx !== 0 || dy !== 0) {
          viewport.panBy(dx, dy)
          // One gesture, one commit: the store hears the new transform once, as it does after a drag.
          viewport.commit()
        }

        return true
      },
    }),
    [cache, documentRect, viewport],
  )

  useEffect(() => {
    onReady?.(handle)

    return () => onReady?.(null)
  }, [handle, onReady])

  return handle
}
