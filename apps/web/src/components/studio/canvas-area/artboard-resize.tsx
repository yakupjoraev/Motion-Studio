'use client'

import { type CanvasHandle, FIT_PADDING } from '@motion-studio/canvas'
import { BREAKPOINTS } from '@motion-studio/schema'
import { type RefObject, type TransitionEventHandler, useCallback, useEffect, useRef } from 'react'

import { useStudioStore } from '../../../store/editor-store'

/**
 * The safety net behind `transitionend`. Under a reduced-motion preference the transition is 0 s and
 * fires nothing at all, and a frame that was already the right width transitions nothing either — in
 * both cases the fit still has to happen, one frame later.
 */
export const FIT_FALLBACK_MS = 250

export interface ArtboardResize {
  /** Canvas units. The artboard transitions to it in CSS — ADR-164. */
  readonly width: number
  /** Put on a wrapper around the canvas: `transitionend` bubbles out of the artboard. */
  readonly onTransitionEnd: TransitionEventHandler<HTMLElement>
}

/**
 * The artboard is the active breakpoint's frame — RESPONSIVE_ENGINE.md § Canvas preview, ADR-166 —
 * and the width itself animates in CSS, so a switch costs one render rather than one per frame.
 *
 * What is left for React is the part CSS cannot do: once the width has settled, a frame that no
 * longer fits the viewport is fitted back into it.
 */
export function useArtboardResize(handle: RefObject<CanvasHandle | null>): ArtboardResize {
  const breakpoint = useStudioStore((state) => state.viewport.breakpoint)
  const pending = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fitIfClipped = useCallback(() => {
    if (!pending.current) {
      return
    }

    pending.current = false

    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }

    const canvas = handle.current

    if (canvas === null) {
      return
    }

    const frame = canvas.documentRect().width * canvas.transform().zoom

    if (frame > canvas.viewportRect().width - FIT_PADDING * 2) {
      canvas.fitDocument()
    }
  }, [handle])

  // The first render is not a switch: opening the studio at `base` must not move a transform the
  // document was saved with.
  const previous = useRef(breakpoint)

  useEffect(() => {
    if (previous.current === breakpoint) {
      return
    }

    previous.current = breakpoint
    pending.current = true
    timer.current = setTimeout(fitIfClipped, FIT_FALLBACK_MS)

    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [breakpoint, fitIfClipped])

  const onTransitionEnd = useCallback<TransitionEventHandler<HTMLElement>>(
    (event) => {
      if (event.propertyName === 'width') {
        fitIfClipped()
      }
    },
    [fitIfClipped],
  )

  return { width: BREAKPOINTS[breakpoint].frame, onTransitionEnd }
}
