'use client'

import type { NodeId } from '@motion-studio/schema'
import { type RefObject, startTransition, useEffect, useMemo, useRef } from 'react'

import { screenPoint } from '../coords/index'
import type { RectCache } from '../rects/rect-cache'

import { marqueeHits, marqueeRect } from './marquee'

/** Read by the band's own style rule; written at frame rate and never through React. */
export const MARQUEE_VARS = {
  x: '--ms-marquee-x',
  y: '--ms-marquee-y',
  width: '--ms-marquee-w',
  height: '--ms-marquee-h',
} as const

export interface MarqueeHookOptions {
  readonly rootRef: RefObject<HTMLElement | null>
  readonly cache: RectCache
  /** The nodes at the current isolation level — the only candidates, per CANVAS.md § Hit testing. */
  readonly candidates: () => readonly NodeId[]
  readonly onCommit: (ids: readonly NodeId[]) => void
}

export interface MarqueeHandle {
  readonly ref: RefObject<HTMLDivElement | null>
  /** Called by the selection hook when a press landed on empty space. */
  begin(event: PointerEvent): void
}

/**
 * The band is one absolutely-positioned div whose geometry is four CSS variables written inside a
 * `rAF`. Nothing here is React state: a marquee across 200 nodes renders the canvas exactly once, on
 * `pointerup`, which is the budget in PERFORMANCE.md § The core rule stated as a gesture.
 */
export function useMarquee({
  rootRef,
  cache,
  candidates,
  onCommit,
}: MarqueeHookOptions): MarqueeHandle {
  const band = useRef<HTMLDivElement | null>(null)
  const beginRef = useRef<((event: PointerEvent) => void) | null>(null)
  const latest = useRef({ cache, candidates, onCommit })

  latest.current = { cache, candidates, onCommit }

  useEffect(() => {
    const root = rootRef.current

    if (root === null) {
      return
    }

    const origin = screenPoint(0, 0)
    const cursor = { x: 0, y: 0 }
    let pointerId: number | null = null
    let frame: number | null = null

    const paint = (): void => {
      frame = null

      const element = band.current

      if (element === null) {
        return
      }

      const rect = marqueeRect(origin, screenPoint(cursor.x, cursor.y))
      const bounds = root.getBoundingClientRect()

      element.style.setProperty(MARQUEE_VARS.x, `${rect.x - bounds.left}px`)
      element.style.setProperty(MARQUEE_VARS.y, `${rect.y - bounds.top}px`)
      element.style.setProperty(MARQUEE_VARS.width, `${rect.width}px`)
      element.style.setProperty(MARQUEE_VARS.height, `${rect.height}px`)
    }

    const stop = (): void => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
        frame = null
      }

      if (pointerId !== null && root.hasPointerCapture(pointerId)) {
        root.releasePointerCapture(pointerId)
      }

      pointerId = null
      root.removeAttribute('data-marquee')
      band.current?.removeAttribute('data-active')
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', stop)
      window.removeEventListener('keydown', onKeyDown)
    }

    function onPointerMove(event: PointerEvent): void {
      cursor.x = event.clientX
      cursor.y = event.clientY

      if (frame === null) {
        frame = requestAnimationFrame(paint)
      }
    }

    function onPointerUp(event: PointerEvent): void {
      const rect = marqueeRect(origin, screenPoint(event.clientX, event.clientY))
      const { cache: rects, candidates: level, onCommit: commit } = latest.current

      stop()

      // A band with no area is a click, and the click already decided: the press that started this
      // marquee resolved to nothing. `intersects` reads a zero rect as a point, so committing here
      // could select a node the click deliberately did not, and the two must agree.
      if (rect.width === 0 || rect.height === 0) {
        return
      }

      const hits = marqueeHits(rect, rects, level(), event.altKey ? 'contain' : 'intersect')

      // The one render of the whole gesture. `startTransition` keeps it off the release's own frame —
      // CANVAS.md § Performance.
      startTransition(() => commit(hits))
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        stop()
      }
    }

    beginRef.current = (event: PointerEvent): void => {
      // Without this the drag selects the text under the band, and the *next* press lands on that
      // selection and starts a native drag — which Chrome announces as `pointercancel`, so the
      // second marquee never sees a `pointerup`. Measured in Chrome 141 before this line existed.
      event.preventDefault()
      // `preventDefault` also cancels the focus the press would have given, and the canvas has to be
      // focused for the arrows and `Tab` to reach it.
      root.focus({ preventScroll: true })

      origin.x = event.clientX
      origin.y = event.clientY
      cursor.x = event.clientX
      cursor.y = event.clientY
      pointerId = event.pointerId
      root.setPointerCapture(event.pointerId)
      root.dataset['marquee'] = 'true'
      band.current?.setAttribute('data-active', 'true')
      // The rects have to be current before the band is over anything; one batched pass at the start
      // of the gesture is the whole layout cost of a marquee.
      latest.current.cache.refresh()
      paint()

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      // A cancelled pointer never delivers `pointerup`; without this the band would stay on screen
      // and `data-marquee` would suppress hover for the rest of the session.
      window.addEventListener('pointercancel', stop)
      window.addEventListener('keydown', onKeyDown)
    }

    return () => {
      beginRef.current = null
      stop()
    }
  }, [rootRef])

  return useMemo<MarqueeHandle>(
    () => ({
      ref: band,
      begin(event) {
        beginRef.current?.(event)
      },
    }),
    [],
  )
}
