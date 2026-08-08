'use client'

import { ChevronDownIcon } from '@motion-studio/icons'
import { Button, Dropdown, type DropdownEntry } from '@motion-studio/ui'

/** Disabled entries cannot be selected; the command system that fills these in arrives in prompt 14. */
const unreachable = (): void => undefined

const ENTRIES: readonly DropdownEntry[] = [
  { id: 'undo', label: 'Undo', shortcut: 'Mod+Z', disabled: true, onSelect: unreachable },
  { id: 'redo', label: 'Redo', shortcut: 'Mod+Shift+Z', disabled: true, onSelect: unreachable },
  { kind: 'separator', id: 'after-history' },
  { id: 'duplicate', label: 'Duplicate', shortcut: 'Mod+D', disabled: true, onSelect: unreachable },
  {
    id: 'delete',
    label: 'Delete',
    shortcut: 'Delete',
    danger: true,
    disabled: true,
    onSelect: unreachable,
  },
  { kind: 'separator', id: 'after-delete' },
  {
    id: 'select-all',
    label: 'Select all',
    shortcut: 'Mod+A',
    disabled: true,
    onSelect: unreachable,
  },
]

export function EditMenu() {
  return (
    <Dropdown
      align="start"
      items={ENTRIES}
      trigger={
        <Button size="sm" trailingIcon={<ChevronDownIcon size={16} />} variant="ghost">
          Edit
        </Button>
      }
    />
  )
}
