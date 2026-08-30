'use client'

import { type RefObject, useEffect, useRef, useState } from 'react'

/** Half a viewport of warning, so a chunk is in flight before the section is on screen. */
const ROOT_MARGIN = '50% 0px'

export interface IslandMount {
  readonly ref: RefObject<HTMLDivElement | null>
  readonly mounted: boolean
}

/**
 * When an island is allowed to start loading — PERFORMANCE.md § Public pages gives `/` 120 kB and a
 * 2.0 s LCP, and three chunks fetched during the first load spend both on sections the visitor has
 * not reached.
 *
 * Above the fold, `eager` mounts on an idle callback: the demo is on screen, so it may not wait for a
 * scroll, but it may wait for the main thread to be free. Below it, an observer with half a viewport
 * of margin starts the fetch before the section arrives, so the swap is never visible.
 */
export function useIslandMount(eager = false): IslandMount {
  const ref = useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (eager) {
      const idle =
        typeof requestIdleCallback === 'function'
          ? requestIdleCallback(() => setMounted(true), { timeout: 1200 })
          : window.setTimeout(() => setMounted(true), 200)

      return () => {
        if (typeof cancelIdleCallback === 'function') {
          cancelIdleCallback(idle)
        } else {
          window.clearTimeout(idle)
        }
      }
    }

    const element = ref.current

    if (element === null) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true)
          observer.disconnect()
        }
      },
      { rootMargin: ROOT_MARGIN },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [eager])

  return { ref, mounted }
}
