import { type MarkupElement, children, el, literal, txt } from '@motion-studio/schema'

import type { HeadingLevel } from '../../marketing/marketing.schema'
import { sectionHeadingMarkup } from '../../marketing/section-heading.markup'
import { iconMarkup } from '../../markup/icon'
import { navIconMarkup } from '../nav-icon.markup'
import { navLinkMarkup } from '../nav-link.markup'
import { NAV_GROUP_HEADING } from '../navigation.styles'

import type { SidebarGroup } from './sidebar-nav.schema'
import {
  SIDEBAR_CHEVRON,
  SIDEBAR_GROUP,
  SIDEBAR_HEADING,
  SIDEBAR_LIST,
  SIDEBAR_TOOLTIP,
  SIDEBAR_TRIGGER,
  sidebarLinkStyles,
} from './sidebar-nav.styles'

export interface SidebarGroupMarkupInput {
  readonly group: SidebarGroup
  readonly collapsed: boolean
  readonly activeHref: string
  readonly headingLevel: HeadingLevel
  /** `${node}-${index}`: the group's heading and its panel have to point at each other. */
  readonly id: string
}

const listMarkup = (group: SidebarGroup, collapsed: boolean, activeHref: string): MarkupElement =>
  el('ul', {
    classNames: [SIDEBAR_LIST],
    children: group.items.map((item) =>
      el('li', {
        children: [
          navLinkMarkup({
            activeHref,
            className: sidebarLinkStyles({ collapsed }),
            href: item.href,
            variant: 'rail',
            children: children(
              navIconMarkup({ name: item.icon }),
              el('span', {
                ...(collapsed ? { classNames: ['sr-only'] } : {}),
                children: [txt(item.label)],
              }),
              collapsed &&
                el('span', {
                  classNames: [SIDEBAR_TOOLTIP],
                  attributes: { 'aria-hidden': literal('true') },
                  children: [txt(item.label)],
                }),
            ),
          }),
        ],
      }),
    ),
  })

/**
 * One labelled group. In rail mode it is never collapsible — 64 px has nowhere to put a disclosure —
 * which is the same rule the component follows, from the same two props.
 */
export function sidebarGroupMarkup({
  group,
  collapsed,
  activeHref,
  headingLevel,
  id,
}: SidebarGroupMarkupInput): MarkupElement {
  const headingId = `${id}-heading`
  const list = listMarkup(group, collapsed, activeHref)

  if (collapsed || !group.collapsible) {
    return el('div', {
      classNames: [SIDEBAR_GROUP],
      attributes: { 'aria-labelledby': literal(headingId), role: literal('group') },
      children: [
        sectionHeadingMarkup({
          className: collapsed ? 'sr-only' : SIDEBAR_HEADING,
          id: headingId,
          level: headingLevel,
          children: [txt(group.title)],
        }),
        list,
      ],
    })
  }

  const panelId = `${id}-panel`

  return el('div', {
    classNames: [SIDEBAR_GROUP],
    attributes: {
      'aria-labelledby': literal(headingId),
      role: literal('group'),
      'data-state': literal('open'),
    },
    children: [
      sectionHeadingMarkup({
        className: 'm-0',
        id: headingId,
        level: headingLevel,
        children: [
          el('button', {
            classNames: [SIDEBAR_TRIGGER],
            attributes: {
              type: literal('button'),
              'aria-controls': literal(panelId),
              'aria-expanded': literal(true),
              'data-state': literal('open'),
            },
            children: children(
              el('span', { classNames: [NAV_GROUP_HEADING], children: [txt(group.title)] }),
              iconMarkup({ name: 'chevron-down', size: 14, className: SIDEBAR_CHEVRON }),
            ),
          }),
        ],
      }),
      el('div', {
        attributes: { 'data-state': literal('open'), id: literal(panelId) },
        children: [list],
      }),
    ],
  })
}
