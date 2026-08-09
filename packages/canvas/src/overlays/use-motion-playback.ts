'use client'

import { type RefObject, useEffect, useRef } from 'react'

import type { CanvasMotionPort } from '../canvas.types'

/** ADR-100. What a descendant reads without importing anything; the port is what the store hears. */
export const MOTION_PAUSED_ATTRIBUTE = 'data-motion-paused'

export interface MotionPlaybackOptions {
  readonly rootRef: RefObject<HTMLElement | null>
  readonly motion: CanvasMotionPort | undefined
}

/**
 * SHORTCUTS.md § Viewport: `Mod+P` freezes motion for inspection and `Mod+Shift+P` replays the
 * entrances. Both are taken off the browser, which would otherwise print the page.
 */
export function useMotionPlayback({ rootRef, motion }: MotionPlaybackOptions): void {
  const latest = useRef(motion)

  latest.current = motion

  useEffect(() => {
    const root = rootRef.current

    if (root === null) {
      return
    }

    const reflect = (): void => {
      const paused = latest.current?.paused() ?? false

      if (paused) {
        root.setAttribute(MOTION_PAUSED_ATTRIBUTE, 'true')

        return
      }

      root.removeAttribute(MOTION_PAUSED_ATTRIBUTE)
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== 'p' || !(event.metaKey || event.ctrlKey)) {
        return
      }

      event.preventDefault()

      const port = latest.current

      if (port === undefined) {
        return
      }

      if (event.shiftKey) {
        port.replay()

        return
      }

      port.setPaused(!port.paused())
      reflect()
    }

    reflect()
    root.addEventListener('keydown', onKeyDown)

    return () => {
      root.removeEventListener('keydown', onKeyDown)
    }
  }, [rootRef])
}
