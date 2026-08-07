import { Z_INDEX } from '@motion-studio/tokens'
import { cn } from '@motion-studio/utils'
import * as RadixDropdown from '@radix-ui/react-dropdown-menu'
import type { ReactElement } from 'react'

import { Kbd } from '../kbd/kbd'

import {
  dropdownContentStyles,
  dropdownItemStyles,
  dropdownLabelStyles,
  dropdownSeparatorStyles,
  dropdownShortcutStyles,
} from './dropdown.styles'

import type { DropdownEntry, DropdownProps } from './dropdown.types'

/**
 * One entry. Written as three early returns rather than a `switch` with a `default`, because the default arm
 * would be a branch no test can reach — TypeScript has already narrowed the union by the last line.
 */
function Entry({ entry }: { entry: DropdownEntry }): ReactElement {
  if (entry.kind === 'separator') {
    return <RadixDropdown.Separator className={dropdownSeparatorStyles()} />
  }

  if (entry.kind === 'label') {
    return (
      <RadixDropdown.Label className={dropdownLabelStyles()}>{entry.label}</RadixDropdown.Label>
    )
  }

  return (
    <RadixDropdown.Item
      onSelect={entry.onSelect}
      {...(entry.disabled === undefined ? {} : { disabled: entry.disabled })}
      className={dropdownItemStyles({ danger: entry.danger ?? false })}
    >
      {entry.icon}
      {entry.label}
      {entry.shortcut === undefined ? null : (
        <Kbd keys={entry.shortcut} className={dropdownShortcutStyles()} />
      )}
    </RadixDropdown.Item>
  )
}

/**
 * Radix DropdownMenu. Radix owns the menu semantics, typeahead, arrow navigation, and returning focus to the
 * trigger on close; this file owns the surface, the density, the shortcut column and the separators.
 *
 * Entries are data rather than children. A menu is a list of commands, and the alternative — compound
 * children — makes every caller reach for `DropdownMenu.Item` and re-decide its styling.
 *
 * No `forwardRef`: this renders no element of its own.
 */
export function Dropdown({
  trigger,
  items,
  side = 'bottom',
  align = 'start',
  open,
  defaultOpen,
  onOpenChange,
  className,
}: DropdownProps): ReactElement {
  // `exactOptionalPropertyTypes`: omit an absent prop rather than passing `undefined`.
  const rootProps = {
    ...(open === undefined ? {} : { open }),
    ...(defaultOpen === undefined ? {} : { defaultOpen }),
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  }

  return (
    <RadixDropdown.Root {...rootProps}>
      <RadixDropdown.Trigger asChild>{trigger}</RadixDropdown.Trigger>

      <RadixDropdown.Portal>
        <RadixDropdown.Content
          side={side}
          align={align}
          sideOffset={4}
          collisionPadding={8}
          data-ms-overlay=""
          style={{ zIndex: Z_INDEX.dropdown }}
          className={cn(dropdownContentStyles(), className)}
        >
          {items.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  )
}
