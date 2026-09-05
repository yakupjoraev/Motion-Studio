'use client'

import { ChevronDownIcon } from '@motion-studio/icons'
import { Button, Dropdown, type DropdownEntry } from '@motion-studio/ui'

import { useStudio } from '../../../lib/i18n/studio-surface'

/** Disabled entries cannot be selected; the command system that fills these in arrives in prompt 14. */
const unreachable = (): void => undefined

export function EditMenu() {
  const { chrome } = useStudio()

  const entries: readonly DropdownEntry[] = [
    {
      id: 'undo',
      label: chrome.editUndo,
      shortcut: 'Mod+Z',
      disabled: true,
      onSelect: unreachable,
    },
    {
      id: 'redo',
      label: chrome.editRedo,
      shortcut: 'Mod+Shift+Z',
      disabled: true,
      onSelect: unreachable,
    },
    { kind: 'separator', id: 'after-history' },
    {
      id: 'duplicate',
      label: chrome.editDuplicate,
      shortcut: 'Mod+D',
      disabled: true,
      onSelect: unreachable,
    },
    {
      id: 'delete',
      label: chrome.editDelete,
      shortcut: 'Delete',
      danger: true,
      disabled: true,
      onSelect: unreachable,
    },
    { kind: 'separator', id: 'after-delete' },
    {
      id: 'select-all',
      label: chrome.editSelectAll,
      shortcut: 'Mod+A',
      disabled: true,
      onSelect: unreachable,
    },
  ]

  return (
    <Dropdown
      align="start"
      items={entries}
      trigger={
        <Button size="sm" trailingIcon={<ChevronDownIcon size={16} />} variant="ghost">
          {chrome.editMenu}
        </Button>
      }
    />
  )
}
