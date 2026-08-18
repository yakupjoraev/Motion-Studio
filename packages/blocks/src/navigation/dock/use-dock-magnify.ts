'use client'

import { useScheduler } from '@motion-studio/motion'
import { type RefObject, useEffect } from 'react'

import { dockScale } from './dock.schema'

/** The attribute the hook finds its items by, so the markup and the maths agree in one place. */
export const DOCK_ITEM_ATTRIBUTE = 'data-dock-item'

export const DOCK_POINTER_VARIABLE = '--ms-dock-pointer'

/**
 * The magnification, from the shared pointer bus to one custom property per item — ADR-195.
 *
 * Two things keep it free. The item centres are measured **once**, on subscribe, as offsets inside the
 * tray, so the per-frame layout read is one rect rather than one per item. And they stay correct while
 * the row swells, because `blocks.css` scales each item about `bottom center` — a scale about the
 * horizontal centre does not move the horizontal centre.
 *
 * The result is a variable rather than state, so a cursor crossing the dock produces zero renders.
 *
 * Reduced motion is not handled here: `blocks.css` multiplies the whole scale by `--ms-reduced-motion`,
 * which is 0 from the media query *and* from the studio's own preview override (ADR-075). One mechanism
 * covers both, where a check in this hook would only have covered the media query.
 */
export function useDockMagnify(
  ref: RefObject<HTMLElement | null>,
  reach: number,
  magnification: number,
  count: number,
): void {
  const scheduler = useScheduler()

  useEffect(() => {
    const element = ref.current

    if (scheduler === null || element === null || count === 0) {
      return
    }

    const items = [...element.querySelectorAll<HTMLElement>(`[${DOCK_ITEM_ATTRIBUTE}]`)]
    const origin = element.getBoundingClientRect()
    const centres = items.map((item) => {
      const box = item.getBoundingClientRect()

      return box.left + box.width / 2 - origin.left
    })

    return scheduler.onPointerMove((point) => {
      const box = element.getBoundingClientRect()
      const withinReach = point.y >= box.top - reach && point.y <= box.bottom + reach

      for (const [index, item] of items.entries()) {
        const centre = centres[index] ?? 0
        const scale = withinReach
          ? dockScale(point.x - (box.left + centre), reach, magnification)
          : 1

        item.style.setProperty(DOCK_POINTER_VARIABLE, String(scale))
      }
    })
  }, [ref, scheduler, reach, magnification, count])
}
