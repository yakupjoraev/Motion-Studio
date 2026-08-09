import { Z_INDEX } from '@motion-studio/tokens'
import { cn } from '@motion-studio/utils'
import * as RadixContextMenu from '@radix-ui/react-context-menu'
import type { ReactElement } from 'react'

import {
  dropdownContentStyles,
  dropdownHintStyles,
  dropdownItemStyles,
  dropdownLabelStyles,
  dropdownSeparatorStyles,
  dropdownShortcutStyles,
} from '../dropdown/index'
import { Kbd } from '../kbd/index'

import type { ContextMenuEntry, ContextMenuProps } from './context-menu.types'

/** Styles come from `Dropdown`: the two menus are the same object reached two ways. */
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
      {entry.hint === undefined ? null : <span className={dropdownHintStyles()}>{entry.hint}</span>}
      {entry.shortcut === undefined || entry.hint !== undefined ? null : (
        <Kbd keys={entry.shortcut} className={dropdownShortcutStyles()} />
      )}
    </RadixContextMenu.Item>
  )
}

/**
 * A right-click has no keyboard equivalent everywhere, so a context menu is never the only way to reach a
 * command. Both menus take the same entry list for that reason.
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
