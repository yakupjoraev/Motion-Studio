import type { ReactNode } from 'react'

import { NavIcon } from '../nav-icon'
import { isActiveHref } from '../navigation.schema'

import type { DockItem as DockItemShape } from './dock.schema'
import { DOCK_ACTIVE_MARK, DOCK_ITEM, DOCK_TOOLTIP } from './dock.styles'

export interface DockItemProps {
  readonly item: DockItemShape
  readonly activeHref: string
}

/**
 * One glyph in the tray.
 *
 * The accessible name is the label, kept in the DOM as `sr-only` text rather than as an `aria-label`, so
 * the tag above the glyph and the announced name are the same string and cannot drift. The magnification
 * is decorative: the glyph and the tag are `aria-hidden`, and nothing a reader hears mentions it.
 *
 * This is the one place in the category that does not render through `NavLink` — the element carries the
 * dock's whole geometry and `data-dock-item`, which is the hook's handle on it. The active state still
 * comes from `isActiveHref`, so the predicate is shared even though the markup is not, and it is carried
 * by a mark under the glyph as well as by `aria-current`.
 */
export function DockItem({ item, activeHref }: DockItemProps) {
  const active = isActiveHref(item.href, activeHref)

  const inside: ReactNode = (
    <>
      <NavIcon name={item.icon} size={20} />
      <span className="sr-only">{item.label}</span>
      <span aria-hidden="true" className={DOCK_TOOLTIP}>
        {item.label}
      </span>
      {active && <span aria-hidden="true" className={DOCK_ACTIVE_MARK} />}
    </>
  )

  if (item.href === '') {
    return (
      <button className={DOCK_ITEM} data-dock-item="" data-testid="dock-item" type="button">
        {inside}
      </button>
    )
  }

  return (
    <a
      aria-current={active ? 'page' : undefined}
      className={DOCK_ITEM}
      data-active={active}
      data-dock-item=""
      data-testid="dock-item"
      href={item.href}
    >
      {inside}
    </a>
  )
}
