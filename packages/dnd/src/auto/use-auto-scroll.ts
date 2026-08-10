'use client'

import type { Point } from '@motion-studio/utils'
import { type RefObject, useEffect, useRef } from 'react'

import { type EdgeBox, edgeSpeed } from './edge-speed'

/** DRAG_AND_DROP.md § Auto-behaviours: 40 px from a tree edge. */
export const AUTO_SCROLL_THRESHOLD_PX = 40
export const AUTO_SCROLL_MAX_SPEED_PX = 10

export interface AutoScrollOptions {
  /** The scrollable element — the layers tree's viewport. */
  readonly scrollRef: RefObject<HTMLElement | null>
  readonly point: () => Point | null
  readonly active: boolean
  readonly schedule?: ((callback: () => void) => number) | undefined
  readonly cancel?: ((handle: number) => void) | undefined
}

/**
 * The same ramp as the canvas pan, applied to a scroll container: a drag that has to reach a row
 * fifty rows down should not require the user to let go, scroll, and pick the node up again.
 */
export function useAutoScroll({
  scrollRef,
  point,
  active,
  schedule = requestAnimationFrame,
  cancel = cancelAnimationFrame,
}: AutoScrollOptions): void {
  const latest = useRef(point)
  latest.current = point

  useEffect(() => {
    if (!active) {
      return
    }

    let frame: number | null = null

    const step = (): void => {
      const element = scrollRef.current
      const at = latest.current()

      if (element !== null && at !== null) {
        const rect = element.getBoundingClientRect()
        const box: EdgeBox = {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
        }
        const speed = edgeSpeed(at, box, {
          threshold: AUTO_SCROLL_THRESHOLD_PX,
          maxSpeed: AUTO_SCROLL_MAX_SPEED_PX,
        })

        if (speed.y !== 0) {
          element.scrollTop += speed.y
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
  }, [active, cancel, schedule, scrollRef])
}
