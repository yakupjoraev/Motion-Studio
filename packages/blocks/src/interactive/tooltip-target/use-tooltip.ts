'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface Tooltip {
  readonly open: boolean
  /** The pointer path: rests for `delay` before the bubble appears, so crossing a row does not flash it. */
  show(): void
  /** The focus path: immediate, because a keyboard user has already committed by the time they land. */
  showNow(): void
  hide(): void
}

/**
 * The three behaviours WCAG 1.4.13 requires of content shown on hover or focus, and the reason this block does
 * not use a `title` attribute or a CSS-only bubble:
 *
 *   - **dismissable** — `Escape` closes it without moving the pointer, which is what the document listener
 *     below is for. A CSS `:hover` rule cannot be dismissed at all;
 *   - **hoverable** — nothing here closes on a timer, and the bubble is a child of the same element the
 *     pointer is over, so moving into it never fires `pointerleave`;
 *   - **persistent** — it stays until the pointer leaves, focus moves, or `Escape` is pressed. There is no
 *     auto-hide, which is the part a `title` attribute gets wrong in every browser.
 */
export function useTooltip(delay: number): Tooltip {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const show = useCallback(() => {
    clear()

    if (delay === 0) {
      setOpen(true)

      return
    }

    timer.current = setTimeout(() => {
      timer.current = null
      setOpen(true)
    }, delay)
  }, [clear, delay])

  const showNow = useCallback(() => {
    clear()
    setOpen(true)
  }, [clear])

  const hide = useCallback(() => {
    clear()
    setOpen(false)
  }, [clear])

  useEffect(() => clear, [clear])

  /*
   * On the document rather than on the trigger: `Escape` has to work while the pointer is over the control and
   * focus is somewhere else entirely, which is the case a key handler on the button would miss.
   */
  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return { open, show, showNow, hide }
}
