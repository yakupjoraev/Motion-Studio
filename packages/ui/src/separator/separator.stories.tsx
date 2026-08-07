import type { Meta, StoryObj } from '@storybook/react'

import { Separator } from './separator'

const meta = {
  title: 'Chrome/Separator',
  component: Separator,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Separator>

export default meta

type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  args: { className: 'w-[240px]' },
}

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div className="flex h-[28px] items-center gap-2 text-foreground-muted text-xs">
      <span>Layout</span>
      <Separator {...args} />
      <span>Effects</span>
    </div>
  ),
}
