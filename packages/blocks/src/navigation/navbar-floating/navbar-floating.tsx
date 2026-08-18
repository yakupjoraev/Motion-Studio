'use client'

import { useRef } from 'react'

import { NavAction } from '../nav-action'
import { NavDrawer } from '../nav-drawer'
import { NavLink } from '../nav-link'
import { NAV_BRAND } from '../navigation.styles'
import { useScrolled } from '../use-scrolled'

import { FLOATING_SHRINK_PX } from './navbar-floating.schema'
import {
  FLOATING_ACTIONS,
  FLOATING_LINK,
  FLOATING_LINKS,
  navbarFloatingStyles,
} from './navbar-floating.styles'
import type { NavbarFloatingProps } from './navbar-floating.types'

/**
 * A detached pill that shrinks once the page has moved under it.
 *
 * The shrink is a `data-scrolled` attribute written from the shared scroll bus and a class that reacts to
 * it (ADR-191) — no React state, so scrolling a page with this bar on it costs no renders. Under reduced
 * motion the transition's duration token collapses to zero, so the scrolled state still applies, instantly,
 * which is what § Reduced motion asks for: a state change without a movement.
 *
 * It declares `requiresBackdrop`, because a glass pill over a flat page is a grey pill.
 */
export function NavbarFloating({
  brandLabel,
  brandHref,
  links,
  actions,
  activeHref,
  ariaLabel,
  hidden,
}: NavbarFloatingProps) {
  const ref = useRef<HTMLElement>(null)

  useScrolled(ref, FLOATING_SHRINK_PX)

  return (
    <nav
      aria-label={ariaLabel}
      className={navbarFloatingStyles({ hidden })}
      data-scrolled="false"
      data-testid="navbar-floating"
      ref={ref}
    >
      <a className={NAV_BRAND} data-testid="navbar-floating-brand" href={brandHref}>
        {brandLabel}
      </a>

      <ul className={FLOATING_LINKS} data-testid="navbar-floating-links">
        {links.map((link, index) => (
          <li key={`${link.label}-${index}`}>
            <NavLink
              activeHref={activeHref}
              className={FLOATING_LINK}
              href={link.href}
              variant="bar"
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className={FLOATING_ACTIONS}>
        {actions.map((action, index) => (
          <NavAction action={action} key={`${action.label}-${index}`} />
        ))}

        <NavDrawer
          actions={actions}
          activeHref={activeHref}
          brandLabel={brandLabel}
          links={links.map((link) => ({ ...link, children: [] }))}
        />
      </div>
    </nav>
  )
}
