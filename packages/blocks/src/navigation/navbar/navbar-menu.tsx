'use client'

import { ChevronDownIcon } from '@motion-studio/icons'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'

import { NavLink } from '../nav-link'
import type { NavItem } from '../navigation.schema'
import { NAV_PANEL_DESCRIPTION, navLinkStyles } from '../navigation.styles'

import {
  NAVBAR_MENU,
  NAVBAR_MENU_LIST,
  NAVBAR_PANEL,
  NAVBAR_PANEL_LABEL,
  NAVBAR_PANEL_LIST,
  NAVBAR_TRIGGER_CHEVRON,
  NAVBAR_VIEWPORT,
  NAVBAR_VIEWPORT_WRAPPER,
} from './navbar.styles'

export interface NavbarMenuProps {
  readonly links: readonly NavItem[]
  readonly activeHref: string
}

/**
 * The desktop links, on Radix NavigationMenu.
 *
 * Radix owns the parts a hand-rolled dropdown gets wrong: `aria-expanded` on the trigger, focus moving
 * into the panel and back out, `Esc` closing it, an outside click closing it, and arrow keys moving
 * along the bar. TECH_STACK.md § Radix UI names the primitive for exactly this.
 *
 * A link with no children is a link, not a trigger with an empty panel — an item that opens nothing
 * should not announce that it opens something.
 */
export function NavbarMenu({ links, activeHref }: NavbarMenuProps) {
  const hasPanel = links.some((link) => link.children.length > 0)

  return (
    // `asChild` onto a div, because Radix Root renders a `nav` of its own and the bar is already one —
    // two nested navigation landmarks would announce the same links twice.
    <NavigationMenu.Root asChild>
      <div className={NAVBAR_MENU} data-testid="navbar-menu">
        <NavigationMenu.List className={NAVBAR_MENU_LIST}>
          {links.map((link, index) => (
            <NavigationMenu.Item key={`${link.label}-${index}`}>
              {link.children.length === 0 ? (
                <NavigationMenu.Link asChild>
                  <NavLink activeHref={activeHref} href={link.href} variant="bar">
                    {link.label}
                  </NavLink>
                </NavigationMenu.Link>
              ) : (
                <>
                  <NavigationMenu.Trigger
                    className={navLinkStyles({ variant: 'bar' })}
                    data-testid="navbar-trigger"
                  >
                    {link.label}
                    <ChevronDownIcon
                      aria-hidden="true"
                      className={NAVBAR_TRIGGER_CHEVRON}
                      size={14}
                    />
                  </NavigationMenu.Trigger>

                  <NavigationMenu.Content className={NAVBAR_PANEL} data-testid="navbar-panel">
                    <ul className={NAVBAR_PANEL_LIST}>
                      {link.children.map((child, childIndex) => (
                        <li key={`${child.label}-${childIndex}`}>
                          <NavigationMenu.Link asChild>
                            <NavLink activeHref={activeHref} href={child.href} variant="panel">
                              <span className={NAVBAR_PANEL_LABEL}>{child.label}</span>
                              {child.description !== '' && (
                                <span className={NAV_PANEL_DESCRIPTION}>{child.description}</span>
                              )}
                            </NavLink>
                          </NavigationMenu.Link>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenu.Content>
                </>
              )}
            </NavigationMenu.Item>
          ))}
        </NavigationMenu.List>

        {hasPanel && (
          <div className={NAVBAR_VIEWPORT_WRAPPER}>
            <NavigationMenu.Viewport className={NAVBAR_VIEWPORT} />
          </div>
        )}
      </div>
    </NavigationMenu.Root>
  )
}
