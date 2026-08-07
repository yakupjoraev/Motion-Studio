import { Z_INDEX } from '@motion-studio/tokens'
import { cn } from '@motion-studio/utils'
import * as RadixDropdown from '@radix-ui/react-dropdown-menu'
import type { ReactElement } from 'react'

import { Kbd } from '../kbd/index'

import {
  dropdownContentStyles,
  dropdownItemStyles,
  dropdownLabelStyles,
  dropdownSeparatorStyles,
  dropdownShortcutStyles,
} from './dropdown.styles'

import type { DropdownEntry, DropdownProps } from './dropdown.types'

/** Early returns rather than a `switch`: a `default` arm would be a branch no test can reach. */
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

/** Entries are data, not children: a menu is a list of commands. No `forwardRef` — no element of its own. */
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
