'use client'

import type { NodeId } from '@motion-studio/schema'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { type CanvasRect, type ViewportRect, screenRectToCanvas } from '../coords/index'
import type { RectCache } from '../rects/rect-cache'
import type { ViewportHandle } from '../viewport/use-viewport'

import type { OverlayFrame, OverlayPaint, OverlayPainter } from './overlay.types'

export interface OverlayRectsOptions {
  readonly viewport: ViewportHandle
  readonly cache: RectCache
}

/**
 * The one loop of CANVAS.md § Overlays. Every overlay registers a paint callback and the loop calls
 * them in one `requestAnimationFrame`, so ten selected nodes cost one frame callback rather than ten.
 *
 * A cached rect is a screen rect measured under the transform of the moment it was read, so the
 * conversion to canvas units uses **that** transform and not the current one — converting a rect
 * measured before a pan under the transform after it would offset every overlay by the pan.
 */
export function useOverlayRects({ viewport, cache }: OverlayRectsOptions): OverlayPainter {
  const painters = useRef<Set<OverlayPaint>>(new Set())
  const state = useRef({
    frame: null as number | null,
    dirty: true,
    measured: new Map<NodeId, CanvasRect | undefined>(),
    measuredAt: viewport.current(),
    bounds: viewport.viewportRect() as ViewportRect,
  })

  const run = useCallback(() => {
    state.current.frame = null

    const { dirty } = state.current

    if (dirty) {
      state.current.measured.clear()
      state.current.dirty = false
    }

    const frame: OverlayFrame = {
      transform: viewport.current(),
      dirty,
      rect(id) {
        const { measured, measuredAt, bounds } = state.current

        if (!measured.has(id)) {
          const screen = cache.get(id)

          measured.set(
            id,
            screen === undefined ? undefined : screenRectToCanvas(screen, measuredAt, bounds),
          )
        }

        return measured.get(id)
      },
    }

    for (const paint of painters.current) {
      paint(frame)
    }
  }, [cache, viewport])

  const schedule = useCallback(() => {
    if (state.current.frame === null) {
      state.current.frame = requestAnimationFrame(run)
    }
  }, [run])

  useEffect(() => {
    const stop = cache.subscribe(() => {
      state.current.dirty = true
      state.current.measuredAt = viewport.current()
      state.current.bounds = viewport.viewportRect()
      schedule()
    })

    return stop
  }, [cache, schedule, viewport])

  // Every frame the transform moves: the chip flip and the handle floor are screen-space questions.
  useEffect(() => viewport.subscribe(schedule), [schedule, viewport])

  useEffect(() => {
    const held = state.current

    return () => {
      if (held.frame !== null) {
        cancelAnimationFrame(held.frame)
        held.frame = null
      }
    }
  }, [])

  return useMemo<OverlayPainter>(
    () => ({
      register(paint) {
        painters.current.add(paint)

        return () => {
          painters.current.delete(paint)
        }
      },
      invalidate() {
        state.current.dirty = true
        schedule()
      },
      schedule,
    }),
    [schedule],
  )
}

/** One overlay, one callback, registered for as long as the element is mounted. */
export function useOverlayPaint(painter: OverlayPainter, paint: OverlayPaint): void {
  const latest = useRef(paint)

  latest.current = paint

  useEffect(() => {
    const stop = painter.register((frame) => latest.current(frame))

    // A freshly rendered overlay has no variables yet, and the cache may not read again on its own.
    painter.invalidate()

    return stop
  }, [painter])
}
