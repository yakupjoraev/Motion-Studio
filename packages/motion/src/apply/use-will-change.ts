'use client'

import { type RefObject, useCallback, useEffect, useRef } from 'react'

export interface WillChangeHandle {
  /** Called as a gesture or an animation begins. */
  start(): void
  /** Called when it ends — and this is the half that matters. */
  stop(): void
}

/**
 * PERFORMANCE.md § Layer count: every `will-change` promotes a compositing layer, and fifty layers is
 * a memory problem that can be slower than none. So the hint goes on when something is actually
 * moving and comes off the moment it stops — a permanent hint in a stylesheet is the anti-pattern.
 */
export function useWillChange(
  ref: RefObject<HTMLElement | null>,
  properties: readonly string[],
): WillChangeHandle {
  const active = useRef(false)
  const value = properties.join(', ')

  const start = useCallback(() => {
    const element = ref.current

    if (element === null || value === '') {
      return
    }

    active.current = true
    element.style.willChange = value
  }, [ref, value])

  const stop = useCallback(() => {
    const element = ref.current

    if (element === null || !active.current) {
      return
    }

    active.current = false
    element.style.removeProperty('will-change')
  }, [ref])

  // An unmount in the middle of a gesture is still an end, and the element may outlive this component
  // in an exit animation.
  useEffect(() => stop, [stop])

  return { start, stop }
}
