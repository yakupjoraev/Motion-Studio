import { Z_INDEX } from '@motion-studio/tokens'
import { cn } from '@motion-studio/utils'
import * as RadixContextMenu from '@radix-ui/react-context-menu'
import type { ReactElement } from 'react'

import {
  dropdownContentStyles,
  dropdownItemStyles,
  dropdownLabelStyles,
  dropdownSeparatorStyles,
  dropdownShortcutStyles,
} from '../dropdown/index'
import { Kbd } from '../kbd/index'

import type { ContextMenuEntry, ContextMenuProps } from './context-menu.types'

/**
 * One entry. The styles come from `Dropdown` rather than from a second set of near-identical `cva` calls:
 * a context menu is the same list of commands as a dropdown, and a right-click menu that sits 2 px taller
 * than the same menu opened from a button is the kind of drift a design system exists to prevent.
 */
function Entry({ entry }: { entry: ContextMenuEntry }): ReactElement {
  if (entry.kind === 'separator') {
    return <RadixContextMenu.Separator className={dropdownSeparatorStyles()} />
  }

  if (entry.kind === 'label') {
    return (
      <RadixContextMenu.Label className={dropdownLabelStyles()}>
        {entry.label}
      </RadixContextMenu.Label>
    )
  }

  return (
    <RadixContextMenu.Item
      onSelect={entry.onSelect}
      {...(entry.disabled === undefined ? {} : { disabled: entry.disabled })}
      className={dropdownItemStyles({ danger: entry.danger ?? false })}
    >
      {entry.icon}
      {entry.label}
      {entry.shortcut === undefined ? null : (
        <Kbd keys={entry.shortcut} className={dropdownShortcutStyles()} />
      )}
    </RadixContextMenu.Item>
  )
}

/**
 * Radix ContextMenu. Radix owns opening at the pointer, the long-press path on touch, the menu semantics and
 * the focus restore.
 *
 * `SHORTCUTS.md` § Accessibility notes: "every shortcut has a non-keyboard equivalent". The reverse holds
 * too — a context menu is never the only way to reach a command, because a right-click has no keyboard
 * equivalent on every platform. Callers put the same entries in a `Dropdown`, which is why both take the
 * same list.
 */
export function ContextMenu({
  children,
  items,
  onOpenChange,
  className,
}: ContextMenuProps): ReactElement {
  const rootProps = onOpenChange === undefined ? {} : { onOpenChange }

  return (
    <RadixContextMenu.Root {...rootProps}>
      <RadixContextMenu.Trigger asChild>{children}</RadixContextMenu.Trigger>

      <RadixContextMenu.Portal>
        <RadixContextMenu.Content
          collisionPadding={8}
          data-ms-overlay=""
          style={{ zIndex: Z_INDEX.dropdown }}
          className={cn(dropdownContentStyles(), className)}
        >
          {items.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  )
}
