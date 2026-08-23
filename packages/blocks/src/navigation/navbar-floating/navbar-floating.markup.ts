import { defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { navActionMarkup } from '../nav-action.markup'
import { navDrawerMarkup } from '../nav-drawer.markup'
import { navLinkMarkup } from '../nav-link.markup'
import { NAV_BRAND } from '../navigation.styles'

import {
  FLOATING_ACTIONS,
  FLOATING_LINK,
  FLOATING_LINKS,
  navbarFloatingStyles,
} from './navbar-floating.styles'
import type { NavbarFloatingProps } from './navbar-floating.types'

export const navbarFloatingMarkup = defineMarkup<NavbarFloatingProps>(
  ({ props: { brandLabel, brandHref, links, actions, activeHref, ariaLabel, hidden } }) =>
    el('nav', {
      classNames: [navbarFloatingStyles({ hidden })],
      attributes: { 'aria-label': literal(ariaLabel), 'data-scrolled': literal('false') },
      children: [
        el('a', {
          classNames: [NAV_BRAND],
          attributes: { href: literal(brandHref) },
          children: [txt(brandLabel)],
        }),
        el('ul', {
          classNames: [FLOATING_LINKS],
          children: links.map((link) =>
            el('li', {
              children: [
                navLinkMarkup({
                  activeHref,
                  className: FLOATING_LINK,
                  href: link.href,
                  variant: 'bar',
                  children: [txt(link.label)],
                }),
              ],
            }),
          ),
        }),
        el('div', {
          classNames: [FLOATING_ACTIONS],
          children: [...actions.map(navActionMarkup), navDrawerMarkup()],
        }),
      ],
    }),
)
