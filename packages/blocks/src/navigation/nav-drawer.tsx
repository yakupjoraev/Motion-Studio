'use client'

import { MenuIcon, XIcon } from '@motion-studio/icons'
import * as Dialog from '@radix-ui/react-dialog'

import type { Action } from '../marketing/marketing.schema'

import { NavAction } from './nav-action'
import {
  NAV_DRAWER,
  NAV_DRAWER_ACTIONS,
  NAV_DRAWER_HEADER,
  NAV_DRAWER_LIST,
  NAV_DRAWER_OVERLAY,
  NAV_DRAWER_SUBLIST,
  NAV_DRAWER_TITLE,
  NAV_DRAWER_TRIGGER,
} from './nav-drawer.styles'
import { NavLink } from './nav-link'
import { CLOSE_MENU_LABEL, type NavItem, OPEN_MENU_LABEL } from './navigation.schema'
import { NAV_ICON_BUTTON } from './navigation.styles'

export interface NavDrawerProps {
  readonly brandLabel: string
  readonly links: readonly NavItem[]
  readonly actions: readonly Action[]
  readonly activeHref: string
}

/**
 * The navigation below `md`, on Radix Dialog. Both bars open this one.
 *
 * Dialog is the primitive because the requirement is a dialog's requirement: focus trapped inside the
 * sheet, `Esc` closing it, and focus returned to the trigger — ACCESSIBILITY.md § Dialogs. A drawer that
 * merely toggles a class leaves the reader tabbing through the page behind it.
 *
 * Children are indented rather than collapsed. A second disclosure inside a sheet the reader had to open
 * is one more thing between them and the link they came for.
 */
export function NavDrawer({ brandLabel, links, actions, activeHref }: NavDrawerProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label={OPEN_MENU_LABEL}
        className={`${NAV_ICON_BUTTON} ${NAV_DRAWER_TRIGGER}`}
        data-testid="nav-drawer-trigger"
      >
        <MenuIcon aria-hidden="true" size={20} />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className={NAV_DRAWER_OVERLAY} data-testid="nav-drawer-overlay" />

        <Dialog.Content
          // No description to point at: the sheet's content is the list itself.
          aria-describedby={undefined}
          className={NAV_DRAWER}
          data-testid="nav-drawer"
        >
          <div className={NAV_DRAWER_HEADER}>
            <Dialog.Title className={NAV_DRAWER_TITLE}>{brandLabel}</Dialog.Title>
            <Dialog.Close
              aria-label={CLOSE_MENU_LABEL}
              className={NAV_ICON_BUTTON}
              data-testid="nav-drawer-close"
            >
              <XIcon aria-hidden="true" size={20} />
            </Dialog.Close>
          </div>

          <ul className={NAV_DRAWER_LIST}>
            {links.map((link, index) => (
              <li key={`${link.label}-${index}`}>
                {link.href === '' ? (
                  <span className={NAV_DRAWER_TITLE}>{link.label}</span>
                ) : (
                  <NavLink activeHref={activeHref} href={link.href} variant="drawer">
                    {link.label}
                  </NavLink>
                )}

                {link.children.length > 0 && (
                  <ul className={NAV_DRAWER_SUBLIST}>
                    {link.children.map((child, childIndex) => (
                      <li key={`${child.label}-${childIndex}`}>
                        <NavLink activeHref={activeHref} href={child.href} variant="drawer">
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          {actions.length > 0 && (
            <div className={NAV_DRAWER_ACTIONS}>
              {actions.map((action, index) => (
                <NavAction action={action} key={`${action.label}-${index}`} />
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
