import { CopyIcon, DeleteIcon, DuplicateIcon, LockIcon } from '@motion-studio/icons'
import type { Meta, StoryObj } from '@storybook/react'

import { ContextMenu } from './context-menu'

const meta = {
  title: 'Chrome/ContextMenu',
  component: ContextMenu,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ContextMenu>

export default meta

type Story = StoryObj<typeof meta>

const noop = (): void => undefined

const Region = (
  <div className="grid h-[120px] w-[280px] place-items-center rounded-md border border-border border-dashed text-foreground-subtle text-xs">
    Right-click here
  </div>
)

export const Default: Story = {
  args: {
    children: Region,
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
