'use client'

import { useScheduler } from '@motion-studio/motion'
import { type RefObject, useEffect } from 'react'

/**
 * Writes `data-scrolled` on the element from the shared scroll bus, so the bar's scrolled treatment is
 * a class rather than a render — ADR-191.
 *
 * With no scheduler above it (Storybook without the decorator, a test, an exported page before the
 * printers wire one) nothing subscribes and the bar keeps its unscrolled treatment, which is a finished
 * composition rather than a broken one. The spotlight effect resolves the same question the same way.
 */
export function useScrolled(ref: RefObject<HTMLElement | null>, threshold: number): void {
  const scheduler = useScheduler()

  useEffect(() => {
    const element = ref.current

    if (scheduler === null || element === null) {
      return
    }

    return scheduler.onScroll(({ offset }) => {
      element.setAttribute('data-scrolled', offset > threshold ? 'true' : 'false')
    })
  }, [ref, scheduler, threshold])
}
