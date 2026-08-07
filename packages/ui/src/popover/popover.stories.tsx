import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '../button/index'
import { Input } from '../input/index'

import { Popover } from './popover'

const meta = {
  title: 'Chrome/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Popover>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Presets',
    trigger: <Button>Presets</Button>,
    children: <p className="text-foreground-muted">No presets saved yet.</p>,
  },
}

export const WithControls: Story = {
  args: {
    label: 'Rename layer',
    trigger: <Button variant="ghost">Rename</Button>,
    children: (
      <div className="flex flex-col gap-2">
        <Input aria-label="Layer name" defaultValue="Hero" />
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button variant="primary" size="sm">
            Rename
          </Button>
        </div>
      </div>
    ),
  },
}

export const Above: Story = { ...Default, args: { ...Default.args, side: 'top' } }

export const AlignedToTheEnd: Story = { ...Default, args: { ...Default.args, align: 'end' } }
