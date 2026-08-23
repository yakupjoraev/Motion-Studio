import { type MarkupElement, children, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'
import { navLinkMarkup } from '../nav-link.markup'
import type { NavItem } from '../navigation.schema'
import { navLinkStyles } from '../navigation.styles'

import {
  NAVBAR_MENU,
  NAVBAR_MENU_LIST,
  NAVBAR_TRIGGER_CHEVRON,
  NAVBAR_VIEWPORT_WRAPPER,
} from './navbar.styles'

export interface NavbarMenuMarkupInput {
  readonly links: readonly NavItem[]
  readonly activeHref: string
  readonly id: string
}

/**
 * The bar's own menu.
 *
 * A link with children is a trigger and a panel; closed, only the trigger is in the document, which is
 * what the canvas holds too. The panel is behaviour, and the reader reaches it through the trigger.
 */
export const navbarMenuMarkup = ({ links, activeHref, id }: NavbarMenuMarkupInput): MarkupElement =>
  el('div', {
    classNames: [NAVBAR_MENU],
    attributes: {
      'aria-label': literal('Main'),
      'data-orientation': literal('horizontal'),
      dir: literal('ltr'),
    },
    children: children(
      el('div', {
        cssVars: { position: 'relative' },
        children: [
          el('ul', {
            classNames: [NAVBAR_MENU_LIST],
            attributes: { 'data-orientation': literal('horizontal'), dir: literal('ltr') },
            children: links.map((link, index) =>
              el('li', {
                children:
                  link.children.length === 0
                    ? [
                        navLinkMarkup({
                          activeHref,
                          href: link.href,
                          variant: 'bar',
                          children: [txt(link.label)],
                        }),
                      ]
                    : [
                        el('button', {
                          classNames: [navLinkStyles({ variant: 'bar' })],
                          attributes: {
                            id: literal(`${id}-trigger-${index}`),
                            'data-state': literal('closed'),
                            'aria-expanded': literal(false),
                          },
                          children: children(
                            txt(link.label),
                            iconMarkup({
                              name: 'chevron-down',
                              size: 14,
                              className: NAVBAR_TRIGGER_CHEVRON,
                            }),
                          ),
                        }),
                      ],
              }),
            ),
          }),
        ],
      }),
      links.some((link) => link.children.length > 0) &&
        el('div', { classNames: [NAVBAR_VIEWPORT_WRAPPER] }),
    ),
  })
