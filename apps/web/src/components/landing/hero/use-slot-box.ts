'use client'

import { type RefObject, useCallback, useLayoutEffect, useRef, useState } from 'react'

export interface SlotBox {
  readonly top: number
  readonly height: number
}

/**
 * Where the hero's place in the page actually is, in canvas units.
 *
 * `offsetTop` and `offsetHeight` are layout pixels of the stage, and the stage is laid out at its
 * full 1280 px and *drawn* scaled — a transform changes no layout — so these are canvas units with no
 * arithmetic. They are measured rather than assumed because the block decides its own height: a slot
 * constant would be a second opinion about it, and the two would disagree the first time the block's
 * padding changed.
 */
export function useSlotBox(): {
  readonly ref: RefObject<HTMLDivElement | null>
  readonly box: SlotBox
} {
  const ref = useRef<HTMLDivElement | null>(null)
  const [box, setBox] = useState<SlotBox>({ top: 96, height: 420 })

  /*
   * Only when a number actually moved. A `ResizeObserver` that sets a fresh object on every
   * observation re-renders the page inside the frame, the page reports its size again, and the two
   * feed each other — the tab stops responding, which is exactly what it did before this guard.
   */
  const measure = useCallback((): void => {
    const element = ref.current

    if (element === null) {
      return
    }

    const next = { top: element.offsetTop, height: element.offsetHeight }

    setBox((current) =>
      current.top === next.top && current.height === next.height ? current : next,
    )
  }, [])

  useLayoutEffect(() => {
    measure()

    const element = ref.current

    if (element === null || typeof ResizeObserver !== 'function') {
      return
    }

    // The block lands in its own chunk after this mounts, and the page grows when it does.
    const observer = new ResizeObserver(measure)

    observer.observe(element)

    return () => observer.disconnect()
  }, [measure])

  return { ref, box }
}
