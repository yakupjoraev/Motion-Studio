'use client'

import { type RefObject, useEffect, useMemo, useRef } from 'react'

import { screenPoint, screenToCanvas } from '../../coords/index'
import type { ViewportHandle } from '../../viewport/use-viewport'
import { placeOnAxis } from '../snap.styles'
import type { CanvasGuidePort, SnapAxis } from '../snap.types'

/** Element-scoped, read by the cursor marker's own style rule. */
export const CURSOR_VAR = '--ms-ruler-cursor'

/** What a drop has to land on to count as "back on the ruler", which is the delete gesture. */
export const RULER_ATTRIBUTE = 'data-ruler'

export type AxisRefs = Readonly<Record<SnapAxis, RefObject<HTMLDivElement | null>>>

export interface RulerDragOptions {
  readonly viewport: ViewportHandle
  readonly guides?: CanvasGuidePort | undefined
  /** One line per axis, shown while a guide is being pulled out of a ruler and before it exists. */
  readonly previews: AxisRefs
  readonly cursors: AxisRefs
}

export interface RulerDragHandle {
  /** `axis` is the new guide's: pulling down off the top ruler makes a horizontal one, `y`. */
  start(event: React.PointerEvent<HTMLElement>, axis: SnapAxis): void
}

/** Where the pointer is, in canvas units, on one axis. */
export function canvasAt(viewport: ViewportHandle, event: PointerEvent, axis: SnapAxis): number {
  const canvas = screenToCanvas(
    screenPoint(event.clientX, event.clientY),
    viewport.current(),
    viewport.viewportRect(),
  )

  return axis === 'x' ? canvas.x : canvas.y
}

/** True when the pointer is over a ruler strip — where a dropped guide is deleted. */
export function overRuler(event: PointerEvent): boolean {
  return (
    document.elementFromPoint(event.clientX, event.clientY)?.closest(`[${RULER_ATTRIBUTE}]`) != null
  )
}

/**
 * The pointer half of the rulers: the cursor marker, and dragging a new guide out of a strip. Both
 * write styles inside a `rAF` — a marker that followed the pointer through React state would render
 * the canvas root sixty times a second.
 */
export function useRulerDrag({
  viewport,
  guides,
  previews,
  cursors,
}: RulerDragOptions): RulerDragHandle {
  const latest = useRef({ guides })

  latest.current = { guides }

  useEffect(() => {
    const root = viewport.rootRef.current

    if (root === null) {
      return
    }

    const point = { x: 0, y: 0 }
    let frame: number | null = null

    const paint = (): void => {
      frame = null

      const rect = viewport.viewportRect()

      cursors.x.current?.style.setProperty(CURSOR_VAR, `${point.x - rect.left}px`)
      cursors.y.current?.style.setProperty(CURSOR_VAR, `${point.y - rect.top}px`)
    }

    const onMove = (event: PointerEvent): void => {
      point.x = event.clientX
      point.y = event.clientY

      if (frame === null) {
        frame = requestAnimationFrame(paint)
      }
    }

    root.addEventListener('pointermove', onMove)

    return () => {
      root.removeEventListener('pointermove', onMove)

      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
    }
  }, [cursors, viewport])

  return useMemo<RulerDragHandle>(
    () => ({
      start(event, axis) {
        // A press on a ruler is neither a selection nor a marquee, and both listen on the root.
        event.stopPropagation()
        event.preventDefault()

        const strip = event.currentTarget
        const preview = previews[axis].current
        const pointerId = event.pointerId
        const side = axis === 'x' ? 'left' : 'top'
        let value = 0
        let frame: number | null = null

        const paint = (): void => {
          frame = null

          if (preview !== null) {
            preview.style[side] = placeOnAxis(axis, value)
          }
        }

        const onMove = (move: PointerEvent): void => {
          value = canvasAt(viewport, move, axis)

          if (frame === null) {
            frame = requestAnimationFrame(paint)
          }
        }

        const onUp = (up: PointerEvent): void => {
          finish()

          // Released back on the ruler it came from: nothing was pulled out, so nothing is created.
          if (!overRuler(up)) {
            latest.current.guides?.add(axis, canvasAt(viewport, up, axis))
          }
        }

        function finish(): void {
          if (frame !== null) {
            cancelAnimationFrame(frame)
            frame = null
          }

          preview?.removeAttribute('data-active')

          if (strip.hasPointerCapture(pointerId)) {
            strip.releasePointerCapture(pointerId)
          }

          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          window.removeEventListener('pointercancel', finish)
        }

        preview?.setAttribute('data-active', 'true')
        strip.setPointerCapture(pointerId)
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', finish)
      },
    }),
    [previews, viewport],
  )
}
