import type { Meta, StoryObj } from '@storybook/react'

import { Input } from '../input/index'

import { Label } from './label'

const meta = {
  title: 'Chrome/Label',
  component: Label,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { children: 'Opacity' } }

export const Required: Story = { args: { children: 'Name', required: true } }

export const InAControlRow: Story = {
  args: { children: 'Opacity' },
  render: () => (
    <div className="flex h-[28px] w-[240px] items-center gap-2 px-2">
      <Label htmlFor="opacity">Opacity</Label>
      <Input id="opacity" defaultValue="72" suffix="%" />
    </div>
  ),
}
