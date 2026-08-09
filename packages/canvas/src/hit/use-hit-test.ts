'use client'

import type { NodeId } from '@motion-studio/schema'
import { type RefObject, startTransition, useEffect, useRef } from 'react'

import { screenPoint } from '../coords/index'

import { type HitContext, hitTest } from './hit-test'

export interface HitTestHookOptions {
  readonly rootRef: RefObject<HTMLElement | null>
  /** Read per frame, not captured: isolation changes while the pointer is still moving. */
  readonly context: () => HitContext
  readonly onHover: (id: NodeId | null) => void
}

/**
 * CANVAS.md § Overlays: the hover outline is an `elementsFromPoint` on move, throttled to a frame.
 * A trackpad delivers pointer moves faster than the compositor paints, so an unthrottled hit test
 * pays for hits nobody ever sees.
 *
 * Suspended during a pan or a marquee. Both are gestures with their own meaning for the pointer, and
 * a hover outline chasing a marquee is noise — the same rule as "hidden during drag" in that table.
 */
export function useHitTest({ rootRef, context, onHover }: HitTestHookOptions): void {
  const latest = useRef(context)
  const report = useRef(onHover)

  latest.current = context
  report.current = onHover

  useEffect(() => {
    const root = rootRef.current

    if (root === null) {
      return
    }

    const point = { x: 0, y: 0 }
    let frame: number | null = null
    let hovered: NodeId | null = null

    const publish = (id: NodeId | null): void => {
      if (id === hovered) {
        return
      }

      hovered = id
      // A hover is not on the gesture's critical path, and it may re-render an overlay tree.
      startTransition(() => report.current(id))
    }

    const measure = (): void => {
      frame = null
      publish(hitTest(screenPoint(point.x, point.y), latest.current()))
    }

    const onPointerMove = (event: PointerEvent): void => {
      if (
        root.dataset['panning'] === 'true' ||
        root.dataset['marquee'] === 'true' ||
        root.dataset['dragging'] === 'true'
      ) {
        // Not merely "stop testing": the hover outline is hidden during a gesture, and leaving the
        // last hit standing would leave it on screen under the marquee.
        publish(null)

        return
      }

      point.x = event.clientX
      point.y = event.clientY

      if (frame === null) {
        frame = requestAnimationFrame(measure)
      }
    }

    const onPointerLeave = (): void => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
        frame = null
      }

      publish(null)
    }

    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerleave', onPointerLeave)

    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }

      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [rootRef])
}
