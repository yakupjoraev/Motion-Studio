'use client'

import { useScheduler } from '@motion-studio/motion'
import { type RefObject, useEffect } from 'react'

/**
 * The pointer half of the spotlight, kept apart from the markup because it is the only part with a
 * decision in it: subscribe to the **shared** pointer bus, convert the page point into the layer's
 * own box, and write two custom properties. No listener of its own, no React state, and therefore no
 * render — ANIMATION_SYSTEM.md § The scheduler, the same contract the cursor presets keep.
 *
 * With no scheduler above it — Storybook, an exported page, a test — nothing is subscribed and the
 * variables keep their defaults, which puts the light in the middle. A finished composition rather
 * than a broken one.
 */
export function usePointerLight(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  const scheduler = useScheduler()

  useEffect(() => {
    const element = ref.current

    if (!enabled || scheduler === null || element === null) {
      return
    }

    return scheduler.onPointerMove((point) => {
      const box = element.getBoundingClientRect()

      if (box.width === 0 || box.height === 0) {
        return
      }

      element.style.setProperty('--ms-fx-x', `${((point.x - box.left) / box.width) * 100}%`)
      element.style.setProperty('--ms-fx-y', `${((point.y - box.top) / box.height) * 100}%`)
    })
  }, [ref, enabled, scheduler])
}
