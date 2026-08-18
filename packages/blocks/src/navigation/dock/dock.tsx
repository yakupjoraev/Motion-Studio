'use client'

import { type CSSProperties, type KeyboardEvent, useRef } from 'react'

import { DockItem } from './dock-item'
import { nextDockIndex } from './dock.schema'
import { DOCK_TRAY, dockStyles } from './dock.styles'
import type { DockProps } from './dock.types'
import { DOCK_ITEM_ATTRIBUTE, useDockMagnify } from './use-dock-magnify'

/**
 * A macOS-style dock: a tray of glyphs that swells under the cursor.
 *
 * The swell is a custom property per item, written from the shared pointer bus, so a cursor crossing the
 * dock costs **zero renders** — ADR-195 has the measurement. The keyboard gets the same affordance from
 * the other direction: `:focus-visible` sets the second half of the same product in CSS, so the focused
 * item swells by exactly as much as the hovered one does, and both go still together when
 * `--ms-reduced-motion` is 0.
 *
 * Arrow keys move focus along the row and wrap; `Home` and `End` jump to the ends. The items stay
 * individually tabbable, because a row of links is not a toolbar — a reader who tabs into the dock should
 * be able to tab out of it at the next link, not be trapped in a roving-tabindex group.
 */
export function Dock({ items, magnification, reach, activeHref, ariaLabel, hidden }: DockProps) {
  const ref = useRef<HTMLElement>(null)

  useDockMagnify(ref, reach, magnification, items.length)

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>): void => {
    if (event.defaultPrevented) {
      return
    }

    const focusable = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(`[${DOCK_ITEM_ATTRIBUTE}]`),
    ]
    const current = focusable.indexOf(document.activeElement as HTMLElement)

    if (current < 0) {
      return
    }

    const next = nextDockIndex(event.key, current, focusable.length)

    if (next === null) {
      return
    }

    event.preventDefault()
    focusable[next]?.focus()
  }

  const style = { '--ms-dock-magnification': magnification } as CSSProperties

  return (
    <nav
      aria-label={ariaLabel}
      className={dockStyles({ hidden })}
      data-testid="dock"
      ref={ref}
      style={style}
    >
      <ul className={DOCK_TRAY} data-testid="dock-tray" onKeyDown={onKeyDown}>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            <DockItem activeHref={activeHref} item={item} />
          </li>
        ))}
      </ul>
    </nav>
  )
}
