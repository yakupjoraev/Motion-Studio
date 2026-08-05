import type { Meta, StoryObj } from '@storybook/react'

import { Input } from './input'

const meta = {
  title: 'Chrome/Input',
  component: Input,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { 'aria-label': 'Width', placeholder: 'auto' },
}

export const WithSlots: Story = {
  render: () => (
    <div className="flex w-[220px] flex-col gap-2">
      <Input aria-label="Blur" suffix="px" defaultValue="8" />
      <Input aria-label="Opacity" prefix="%" defaultValue="72" />
    </div>
  ),
}

export const Invalid: Story = {
  args: { 'aria-label': 'Width', invalid: true, defaultValue: 'not-a-number' },
}

export const Disabled: Story = {
  args: { 'aria-label': 'Width', disabled: true, defaultValue: '240' },
}
