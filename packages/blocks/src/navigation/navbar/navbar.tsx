'use client'

import { useRef } from 'react'

import { NavAction } from '../nav-action'
import { NavDrawer } from '../nav-drawer'
import { NAV_BRAND, SKIP_LINK } from '../navigation.styles'
import { useScrolled } from '../use-scrolled'

import { NavbarMenu } from './navbar-menu'
import { SKIP_LINK_LABEL } from './navbar.schema'
import { NAVBAR_ACTIONS, NAVBAR_INNER, navbarStyles } from './navbar.styles'
import type { NavbarProps } from './navbar.types'

/** Any scroll at all is enough: the treatment exists to separate the bar from content moving under it. */
const SCROLLED_THRESHOLD = 0

/**
 * The page's primary navigation: a brand, one level of links, up to two actions, and a drawer below `md`.
 *
 * It is the page's first landmark, which is why it carries the skip link (ADR-192) — the link has to
 * precede everything focusable, and the thing it skips is this block.
 */
export function Navbar({
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
}: NavbarProps) {
  const ref = useRef<HTMLElement>(null)

  useScrolled(ref, SCROLLED_THRESHOLD)

  return (
    <nav
      aria-label={ariaLabel}
      className={navbarStyles({ sticky, hidden })}
      data-scrolled="false"
      data-testid="navbar"
      ref={ref}
    >
      {skipLink && (
        <a className={SKIP_LINK} data-testid="navbar-skip-link" href={skipLinkTarget}>
          {SKIP_LINK_LABEL}
        </a>
      )}

      <div className={NAVBAR_INNER}>
        <a className={NAV_BRAND} data-testid="navbar-brand" href={brandHref}>
          {brandLabel}
        </a>

        <NavbarMenu activeHref={activeHref} links={links} />

        <div className={NAVBAR_ACTIONS} data-testid="navbar-actions">
          {actions.map((action, index) => (
            <NavAction action={action} key={`${action.label}-${index}`} />
          ))}
        </div>

        <NavDrawer
          actions={actions}
          activeHref={activeHref}
          brandLabel={brandLabel}
          links={links}
        />
      </div>
    </nav>
  )
}
