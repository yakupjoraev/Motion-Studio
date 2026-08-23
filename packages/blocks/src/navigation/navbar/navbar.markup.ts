import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { navActionMarkup } from '../nav-action.markup'
import { navDrawerMarkup } from '../nav-drawer.markup'
import { NAV_BRAND, SKIP_LINK } from '../navigation.styles'

import { navbarMenuMarkup } from './navbar-menu.markup'
import { SKIP_LINK_LABEL } from './navbar.schema'
import { NAVBAR_ACTIONS, NAVBAR_INNER, navbarStyles } from './navbar.styles'
import type { NavbarProps } from './navbar.types'

export const navbarMarkup = defineMarkup<NavbarProps>(
  ({
    props: {
      brandLabel,
      brandHref,
      links,
      actions,
      sticky,
      skipLink,
      skipLinkTarget,
      activeHref,
      ariaLabel,
      hidden,
    },
    id,
  }) =>
    el('nav', {
      classNames: [navbarStyles({ sticky, hidden })],
      attributes: { 'aria-label': literal(ariaLabel), 'data-scrolled': literal('false') },
      children: children(
        skipLink &&
          el('a', {
            classNames: [SKIP_LINK],
            attributes: { href: literal(skipLinkTarget) },
            children: [txt(SKIP_LINK_LABEL)],
          }),
        el('div', {
          classNames: [NAVBAR_INNER],
          children: [
            el('a', {
              classNames: [NAV_BRAND],
              attributes: { href: literal(brandHref) },
              children: [txt(brandLabel)],
            }),
            navbarMenuMarkup({ activeHref, id, links }),
            el('div', {
              classNames: [NAVBAR_ACTIONS],
              children: actions.map(navActionMarkup),
            }),
            navDrawerMarkup(),
          ],
        }),
      ),
    }),
)
