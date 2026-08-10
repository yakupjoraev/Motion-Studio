'use client'

import type { NodeId } from '@motion-studio/schema'
import { useEffect, useRef } from 'react'

/** DRAG_AND_DROP.md § Auto-behaviours: long enough to be a decision, short enough not to be a wait. */
export const SPRING_OPEN_MS = 600

export interface SpringOpenOptions {
  /** The collapsed group the drag is currently over, or `null`. */
  readonly over: NodeId | null
  readonly open: (id: NodeId) => void
  readonly delay?: number
}

/**
 * Hovering a collapsed group with something in hand opens it, because the row the user wants is
 * inside it. Leaving before the delay cancels — the timer belongs to *that* group, so sliding across
 * three collapsed groups opens none of them.
 */
export function useSpringOpen({ over, open, delay = SPRING_OPEN_MS }: SpringOpenOptions): void {
  const latest = useRef(open)
  latest.current = open

  useEffect(() => {
    if (over === null) {
      return
    }

    const timer = setTimeout(() => {
      latest.current(over)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [delay, over])
}
