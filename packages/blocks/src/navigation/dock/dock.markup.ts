import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { navIconMarkup } from '../nav-icon.markup'
import { isActiveHref } from '../navigation.schema'

import type { DockItem } from './dock.schema'
import { DOCK_ACTIVE_MARK, DOCK_ITEM, DOCK_TOOLTIP, DOCK_TRAY, dockStyles } from './dock.styles'
import type { DockProps } from './dock.types'

/**
 * One glyph in the tray. The accessible name is `sr-only` text rather than a label, so the tag above
 * the glyph and the announced name are the same string — the same reason the component gives.
 */
const dockItemMarkup = (item: DockItem, activeHref: string) => {
  const active = isActiveHref(item.href, activeHref)
  const inside = children(
    navIconMarkup({ name: item.icon, size: 20 }),
    el('span', { classNames: ['sr-only'], children: [txt(item.label)] }),
    el('span', {
      classNames: [DOCK_TOOLTIP],
      attributes: { 'aria-hidden': literal('true') },
      children: [txt(item.label)],
    }),
    active &&
      el('span', {
        classNames: [DOCK_ACTIVE_MARK],
        attributes: { 'aria-hidden': literal('true') },
      }),
  )

  if (item.href === '') {
    return el('button', {
      classNames: [DOCK_ITEM],
      attributes: { type: literal('button'), 'data-dock-item': literal('') },
      children: inside,
    })
  }

  return el('a', {
    classNames: [DOCK_ITEM],
    attributes: {
      ...(active ? { 'aria-current': literal('page') } : {}),
      'data-active': literal(active),
      'data-dock-item': literal(''),
      href: literal(item.href),
    },
    children: inside,
  })
}

export const dockMarkup = defineMarkup<DockProps>(
  ({ props: { items, magnification, activeHref, ariaLabel, hidden } }) =>
    el('nav', {
      classNames: [dockStyles({ hidden })],
      attributes: { 'aria-label': literal(ariaLabel) },
      cssVars: { '--ms-dock-magnification': String(magnification) },
      children: [
        el('ul', {
          classNames: [DOCK_TRAY],
          children: items.map((item) => el('li', { children: [dockItemMarkup(item, activeHref)] })),
        }),
      ],
    }),
)
