'use client'

import { type RefObject, useEffect, useRef, useState } from 'react'

/**
 * Whether an element has been reached, once.
 *
 * Distinct from `useIslandMount`, which fires half a viewport early so a chunk is in flight before
 * the section arrives. This one is about something the visitor should *see* happen, so it waits
 * until a real part of the element is on screen — an animation that finishes above the fold is an
 * animation nobody was shown.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  amount = 0.4,
): { readonly ref: RefObject<T | null>; readonly seen: boolean } {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (element === null || typeof IntersectionObserver !== 'function') {
      // No observer is not a reason to withhold the content: show the end state.
      setSeen(true)

      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { threshold: amount },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [amount])

  return { ref, seen }
}
