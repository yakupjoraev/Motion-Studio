'use client'

import { contains, edgeRect, useAutoPan, useDragActive } from '@motion-studio/dnd'
import type { Point } from '@motion-studio/utils'
import { type RefObject, useEffect, useRef } from 'react'

import { canvasRects } from './canvas-handle'

/**
 * DRAG_AND_DROP.md § Auto-behaviours: the canvas walks under a drag that nears its edge, so a block
 * can be dropped somewhere the viewport did not start on. The pointer is read from the window rather
 * than from the canvas's own events — the drag ghost sits under the cursor, so the canvas stops
 * hearing about the pointer the moment a drag starts (the same reason the layers tree does it).
 */
export function useCanvasAutoPan(rootRef: RefObject<HTMLElement | null>): void {
  const dragging = useDragActive()
  const point = useRef<Point | null>(null)

  useEffect(() => {
    if (!dragging) {
      return
    }

    // ADR-183: the rects a drop is resolved against are read now, not whenever they last happened to be.
    canvasRects.remeasure()

    /*
     * Only while the pointer is over the canvas. A drag that starts on a palette card starts outside
     * it, and `edgeSpeed` reads a point past an edge as "as fast as it goes" — measured, that panned
     * the scene 240 px sideways before the drag ever reached the canvas, and the drop then landed on
     * nothing at all.
     */
    const onPointerMove = (event: PointerEvent): void => {
      const box = rootRef.current?.getBoundingClientRect() ?? null
      const at = { x: event.clientX, y: event.clientY }

      point.current = box !== null && contains(edgeRect(box), at) ? at : null
    }

    window.addEventListener('pointermove', onPointerMove)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      point.current = null
    }
  }, [dragging, rootRef])

  useAutoPan({
    rootRef,
    active: dragging,
    point: () => point.current,
    pan: canvasRects.panBy,
  })
}
