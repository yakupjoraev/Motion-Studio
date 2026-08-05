import type { Meta, StoryObj } from '@storybook/react'

import { Select } from './select'

const OPTIONS = [
  { value: 'flex', label: 'flex' },
  { value: 'grid', label: 'grid' },
  { value: 'block', label: 'block' },
  { value: 'none', label: 'none', disabled: true },
]

const meta = {
  title: 'Chrome/Select',
  component: Select,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>

const framed = (args: Parameters<typeof Select>[0]) => (
  <div className="w-[180px]">
    <Select {...args} />
  </div>
)

export const Default: Story = {
  args: { 'aria-label': 'Display', options: OPTIONS, placeholder: 'auto' },
  render: framed,
}

export const Selected: Story = {
  args: { 'aria-label': 'Display', options: OPTIONS, defaultValue: 'grid' },
  render: framed,
}

export const Invalid: Story = {
  args: { 'aria-label': 'Display', options: OPTIONS, invalid: true, defaultValue: 'flex' },
  render: framed,
}

export const Disabled: Story = {
  args: { 'aria-label': 'Display', options: OPTIONS, disabled: true, defaultValue: 'flex' },
  render: framed,
}
