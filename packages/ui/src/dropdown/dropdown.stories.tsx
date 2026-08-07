import { CopyIcon, DeleteIcon, DuplicateIcon, LockIcon } from '@motion-studio/icons'
import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '../button/button'

import { Dropdown } from './dropdown'

const meta = {
  title: 'Chrome/Dropdown',
  component: Dropdown,
  parameters: { layout: 'centered' },
  args: { trigger: <Button variant="ghost">Actions</Button> },
} satisfies Meta<typeof Dropdown>

export default meta

type Story = StoryObj<typeof meta>

const noop = (): void => undefined

export const Default: Story = {
  args: {
    items: [
      { id: 'duplicate', label: 'Duplicate', shortcut: 'Mod+D', onSelect: noop },
      { id: 'copy', label: 'Copy', shortcut: 'Mod+C', onSelect: noop },
      { id: 'lock', label: 'Lock', shortcut: 'Mod+Shift+L', onSelect: noop },
    ],
  },
}

export const WithGroupsAndIcons: Story = {
  args: {
    items: [
      { kind: 'label', id: 'edit', label: 'Edit' },
      {
        id: 'duplicate',
        label: 'Duplicate',
        icon: <DuplicateIcon />,
        shortcut: 'Mod+D',
        onSelect: noop,
      },
      { id: 'copy', label: 'Copy', icon: <CopyIcon />, shortcut: 'Mod+C', onSelect: noop },
      { kind: 'separator', id: 'rule' },
      { kind: 'label', id: 'layer', label: 'Layer' },
      { id: 'lock', label: 'Lock', icon: <LockIcon />, shortcut: 'Mod+Shift+L', onSelect: noop },
      {
        id: 'delete',
        label: 'Delete',
        icon: <DeleteIcon />,
        shortcut: 'Delete',
        danger: true,
        onSelect: noop,
      },
    ],
  },
}

export const WithADisabledItem: Story = {
  args: {
    items: [
      { id: 'duplicate', label: 'Duplicate', shortcut: 'Mod+D', onSelect: noop },
      { id: 'paste', label: 'Paste', shortcut: 'Mod+V', disabled: true, onSelect: noop },
    ],
  },
}
