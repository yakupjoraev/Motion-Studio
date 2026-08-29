'use client'

import { type RefObject, useEffect, useState } from 'react'

import type { TargetSize } from './parse-polygon'

/**
 * The overlay's own size in pixels. A `px` polygon is drawn in pixels and the frame is resizable, so
 * the handles have to know the box they sit in — and know it again when the reader drags the frame.
 */
export function useOverlaySize(element: RefObject<HTMLElement | null>): TargetSize {
  const [size, setSize] = useState<TargetSize>({ width: 0, height: 0 })

  useEffect(() => {
    const node = element.current

    if (node === null || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(() => {
      setSize({ width: node.clientWidth, height: node.clientHeight })
    })

    observer.observe(node)

    return () => observer.disconnect()
  }, [element])

  return size
}
