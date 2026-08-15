'use client'

import type { Point } from '@motion-studio/utils'
import { type RefObject, useEffect, useRef } from 'react'

import { type EdgeBox, edgeSpeed } from './edge-speed'

/** DRAG_AND_DROP.md § Auto-behaviours: 60 px from a canvas edge, up to 12 px a frame. */
export const AUTO_PAN_THRESHOLD_PX = 60
export const AUTO_PAN_MAX_SPEED_PX = 12

export interface AutoPanOptions {
  /** The canvas element the drag is over. */
  readonly rootRef: RefObject<HTMLElement | null>
  /** Where the drag point is, read once per frame rather than pushed per event. */
  readonly point: () => Point | null
  /**
   * Screen pixels to pan by. The viewport is a ref in `packages/canvas`, which this package must not
   * import — so the host hands over the one method that moves it (ADR-129).
   */
  readonly pan: (dx: number, dy: number) => void
  readonly active: boolean
  /** Injected so a test can drive frames by hand. */
  readonly schedule?: ((callback: () => void) => number) | undefined
  readonly cancel?: ((handle: number) => void) | undefined
}

/**
 * The canvas walks under the drag when the pointer nears an edge, in the drag's own frame loop and
 * writing nothing to React state — a pan that re-rendered would cost the frame it is trying to buy.
 */
export function useAutoPan({
  rootRef,
  point,
  pan,
  active,
  // Wrapped rather than passed by name: a default parameter is evaluated when the hook runs, and on
  // the server there is no such identifier to evaluate — the studio prerenders its chrome.
  schedule = (callback) => requestAnimationFrame(callback),
  cancel = (handle) => cancelAnimationFrame(handle),
}: AutoPanOptions): void {
  const latest = useRef({ point, pan })
  latest.current = { point, pan }

  useEffect(() => {
    if (!active) {
      return
    }

    let frame: number | null = null

    const step = (): void => {
      const at = latest.current.point()
      const box = boxOf(rootRef.current)

      if (at !== null && box !== null) {
        const speed = edgeSpeed(at, box, {
          threshold: AUTO_PAN_THRESHOLD_PX,
          maxSpeed: AUTO_PAN_MAX_SPEED_PX,
        })

        if (speed.x !== 0 || speed.y !== 0) {
          latest.current.pan(speed.x, speed.y)
        }
      }

      frame = schedule(step)
    }

    frame = schedule(step)

    return () => {
      if (frame !== null) {
        cancel(frame)
      }
    }
  }, [active, cancel, rootRef, schedule])
}

function boxOf(element: HTMLElement | null): EdgeBox | null {
  if (element === null) {
    return null
  }

  const rect = element.getBoundingClientRect()

  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }
}
