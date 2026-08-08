'use client'

import { clamp } from '@motion-studio/utils'
import { useEffect } from 'react'

import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEPS, screenPoint } from '../coords/index'

import { type ViewportHandle, wheelCommitter } from './use-viewport'

/**
 * ADR-074. The largest a single wheel event may move the zoom is one entry of `ZOOM_STEPS`, and the
 * tightest pair of neighbours decides it — derived here so a change to the dropdown carries.
 */
export const WHEEL_ZOOM_CLAMP = ZOOM_STEPS.reduce((tightest, step, index) => {
  const previous = ZOOM_STEPS[index - 1]

  return previous === undefined ? tightest : Math.min(tightest, step / previous)
}, Number.POSITIVE_INFINITY)

/** CANVAS.md § Zoom: the raw factor, before the clamp. */
export const wheelZoomFactor = (deltaY: number): number =>
  clamp(1 - deltaY * 0.01, 1 / WHEEL_ZOOM_CLAMP, WHEEL_ZOOM_CLAMP)

/** ADR-073: the keyboard lands on the values the dropdown shows, in the direction asked for. */
export function nextZoomStep(zoom: number, direction: 1 | -1): number {
  const epsilon = 1e-6
  const candidates =
    direction === 1
      ? ZOOM_STEPS.filter((step) => step > zoom + epsilon)
      : [...ZOOM_STEPS].reverse().filter((step) => step < zoom - epsilon)

  return candidates[0] ?? (direction === 1 ? MAX_ZOOM : MIN_ZOOM)
}

export interface ZoomOptions {
  /** `Shift+1`. The rect the whole document occupies, in canvas units. */
  readonly documentRect: () => Parameters<ViewportHandle['fitTo']>[0]
}

const isZoomWheel = (event: WheelEvent): boolean => event.ctrlKey || event.metaKey

/**
 * Zoom from the wheel, from a pinch — which the browser reports as a ctrl-wheel, so it is the same
 * path — and from the keyboard. Nothing here renders: every branch writes the same ref the pan hook
 * writes, and the store hears about it when the gesture is over.
 */
export function useZoom(viewport: ViewportHandle, options: ZoomOptions): void {
  const documentRect = options.documentRect

  useEffect(() => {
    const root = viewport.rootRef.current

    if (root === null) {
      return
    }

    const wheel = wheelCommitter(() => viewport.commit())

    const onWheel = (event: WheelEvent): void => {
      if (!isZoomWheel(event)) {
        return
      }

      // Without this the browser zooms the page instead: a ctrl-wheel is the OS-level zoom gesture,
      // and a pinch on a trackpad arrives as exactly the same event.
      event.preventDefault()
      viewport.zoomBy(wheelZoomFactor(event.deltaY), screenPoint(event.clientX, event.clientY))
      wheel.bump()
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      const modifier = event.metaKey || event.ctrlKey

      if (modifier && (event.key === '=' || event.key === '+')) {
        event.preventDefault()
        viewport.zoomTo(nextZoomStep(viewport.current().zoom, 1))
        viewport.commit()

        return
      }

      if (modifier && event.key === '-') {
        event.preventDefault()
        viewport.zoomTo(nextZoomStep(viewport.current().zoom, -1))
        viewport.commit()

        return
      }

      if (modifier && event.key === '0') {
        event.preventDefault()
        viewport.zoomTo(1)
        viewport.commit()

        return
      }

      // `Shift+1` is the digit row, so the key is `!` on a US layout and `event.code` is the stable
      // identifier — SHORTCUTS.md § Conflicts says the map is by physical key.
      if (event.shiftKey && !modifier && event.code === 'Digit1') {
        event.preventDefault()
        viewport.fitTo(documentRect())
        viewport.commit()
      }
    }

    root.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      wheel.cancel()
      root.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [documentRect, viewport])
}
