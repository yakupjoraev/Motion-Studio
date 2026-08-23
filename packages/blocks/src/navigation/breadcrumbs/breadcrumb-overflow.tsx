'use client'

import { MoreHorizontalIcon } from '@motion-studio/icons'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import type { NavLink } from '../navigation.schema'

import { overflowLabel } from './breadcrumbs.schema'
import {
  BREADCRUMB_MENU,
  BREADCRUMB_MENU_ITEM,
  BREADCRUMB_OVERFLOW_TRIGGER,
} from './breadcrumbs.styles'

export interface BreadcrumbOverflowProps {
  readonly hidden: readonly NavLink[]
}

/**
 * The middle of a long trail, folded into a menu.
 *
 * Radix DropdownMenu rather than a hover reveal: the trigger is a button with a real name, `Enter` and
 * `Space` open it, the arrow keys move through it, `Esc` closes it, and focus returns to the trigger. A
 * "…" that only opens on hover is the version of this control that keyboard users cannot use at all.
 */
export function BreadcrumbOverflow({ hidden }: BreadcrumbOverflowProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={overflowLabel(hidden.length)}
        className={BREADCRUMB_OVERFLOW_TRIGGER}
        data-testid="breadcrumb-overflow-trigger"
      >
        <MoreHorizontalIcon aria-hidden="true" size={16} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          className={BREADCRUMB_MENU}
          data-testid="breadcrumb-overflow-menu"
          sideOffset={6}
        >
          {hidden.map((item, index) => (
            <DropdownMenu.Item asChild key={`${item.label}-${index}`}>
              <a className={BREADCRUMB_MENU_ITEM} href={item.href}>
                {item.label}
              </a>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
