'use client'

import { ChevronDownIcon } from '@motion-studio/icons'
import { Button, Dropdown, type DropdownEntry } from '@motion-studio/ui'

/**
 * Every entry is disabled, so no `onSelect` can run. The property is required by `DropdownAction`
 * because a live entry must have one; this shell has no document to act on until prompt 12.
 */
const unreachable = (): void => undefined

const ENTRIES: readonly DropdownEntry[] = [
  { id: 'new', label: 'New', shortcut: 'Mod+N', disabled: true, onSelect: unreachable },
  { id: 'open', label: 'Open', shortcut: 'Mod+O', disabled: true, onSelect: unreachable },
  { kind: 'separator', id: 'after-open' },
  { id: 'save', label: 'Save', shortcut: 'Mod+S', disabled: true, onSelect: unreachable },
  {
    id: 'save-as',
    label: 'Save as',
    shortcut: 'Mod+Shift+S',
    disabled: true,
    onSelect: unreachable,
  },
  { id: 'import', label: 'Import JSON', disabled: true, onSelect: unreachable },
  { kind: 'separator', id: 'after-import' },
  { kind: 'label', id: 'recent-label', label: 'Recent' },
  { id: 'recent-empty', label: 'No recent documents', disabled: true, onSelect: unreachable },
]

export function FileMenu() {
  return (
    <Dropdown
      align="start"
      items={ENTRIES}
      trigger={
        <Button size="sm" trailingIcon={<ChevronDownIcon size={16} />} variant="ghost">
          File
        </Button>
      }
    />
  )
}
