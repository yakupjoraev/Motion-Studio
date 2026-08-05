import type { Meta, StoryObj } from '@storybook/react'

import { Textarea } from './textarea'

const meta = {
  title: 'Chrome/Textarea',
  component: Textarea,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { 'aria-label': 'Custom CSS', placeholder: '.hero { … }' },
  render: (args) => (
    <div className="w-[320px]">
      <Textarea {...args} />
    </div>
  ),
}

export const Grown: Story = {
  args: {
    'aria-label': 'Custom CSS',
    defaultValue: '.hero {\n  display: grid;\n  gap: 16px;\n  place-items: center;\n}',
  },
  render: (args) => (
    <div className="w-[320px]">
      <Textarea {...args} />
    </div>
  ),
}

export const BoundedAndScrolling: Story = {
  args: {
    'aria-label': 'Custom CSS',
    maxRows: 4,
    defaultValue: Array.from({ length: 20 }, (_, index) => `/* line ${index + 1} */`).join('\n'),
  },
  render: (args) => (
    <div className="w-[320px]">
      <Textarea {...args} />
    </div>
  ),
}

export const Invalid: Story = {
  args: { 'aria-label': 'Custom CSS', invalid: true, defaultValue: '.hero { color: }' },
  render: (args) => (
    <div className="w-[320px]">
      <Textarea {...args} />
    </div>
  ),
}
