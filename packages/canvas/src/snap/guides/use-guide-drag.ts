'use client'

import { useMemo, useRef } from 'react'

import type { ViewportHandle } from '../../viewport/use-viewport'
import { canvasAt, overRuler } from '../rulers/use-ruler-drag'
import { placeOnAxis } from '../snap.styles'
import type { CanvasGuidePort, UserGuide } from '../snap.types'

export interface GuideDragOptions {
  readonly viewport: ViewportHandle
  readonly guides: CanvasGuidePort
}

export interface GuideDragHandle {
  start(event: React.PointerEvent<HTMLElement>, guide: UserGuide): void
}

/**
 * Moving a guide, and the drop that deletes it. The line follows the pointer by having its own
 * `left` rewritten inside a `rAF`; the store hears once, on release, which is the same shape as
 * every other gesture in this package.
 */
export function useGuideDrag({ viewport, guides }: GuideDragOptions): GuideDragHandle {
  const latest = useRef({ guides })

  latest.current = { guides }

  return useMemo<GuideDragHandle>(
    () => ({
      start(event, guide) {
        // The guide sits in the overlay layer above the canvas; a press on it selects nothing.
        event.stopPropagation()
        event.preventDefault()

        const line = event.currentTarget
        const pointerId = event.pointerId
        const side = guide.axis === 'x' ? 'left' : 'top'
        let value = guide.value
        let frame: number | null = null

        const paint = (): void => {
          frame = null
          line.style[side] = placeOnAxis(guide.axis, value)
        }

        const onMove = (move: PointerEvent): void => {
          value = canvasAt(viewport, move, guide.axis)

          if (frame === null) {
            frame = requestAnimationFrame(paint)
          }
        }

        const onUp = (up: PointerEvent): void => {
          finish()

          // Dropped back on a ruler: the guide goes away — CANVAS.md § Guides.
          if (overRuler(up)) {
            latest.current.guides.remove(guide.id)

            return
          }

          latest.current.guides.move(guide.id, canvasAt(viewport, up, guide.axis))
        }

        function finish(): void {
          if (frame !== null) {
            cancelAnimationFrame(frame)
            frame = null
          }

          if (line.hasPointerCapture(pointerId)) {
            line.releasePointerCapture(pointerId)
          }

          line.removeAttribute('data-dragging')
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          window.removeEventListener('pointercancel', finish)
        }

        line.dataset['dragging'] = 'true'
        line.setPointerCapture(pointerId)
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', finish)
      },
    }),
    [viewport],
  )
}
