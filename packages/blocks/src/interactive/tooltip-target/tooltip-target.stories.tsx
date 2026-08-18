import type { Meta, StoryObj } from '@storybook/react'

import { TooltipTarget } from './tooltip-target'
import { tooltipTargetDefinition } from './tooltip-target.definition'

const meta: Meta<typeof TooltipTarget> = {
  title: 'Blocks/Interactive/TooltipTarget',
  component: TooltipTarget,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex min-h-64 items-center justify-center bg-surface-0 p-16">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof TooltipTarget>

export const Default: Story = { args: tooltipTargetDefinition.defaults }

export const WithAGlyph: Story = {
  args: { ...tooltipTargetDefinition.defaults, icon: 'info', label: 'Version 4' },
}

/** All four sides. There is no collision detection, which is what makes the prop the author's choice. */
export const Sides: Story = {
  args: tooltipTargetDefinition.defaults,
  render: (args) => (
    <div className="grid grid-cols-2 gap-12">
      <TooltipTarget {...args} label="Above" side="top" />
      <TooltipTarget {...args} label="Right" side="right" />
      <TooltipTarget {...args} label="Below" side="bottom" />
      <TooltipTarget {...args} label="Left" side="left" />
    </div>
  ),
}

export const NoDelay: Story = {
  args: { ...tooltipTargetDefinition.defaults, delay: 0, label: 'Instant' },
}

export const OnAGhostControl: Story = {
  args: { ...tooltipTargetDefinition.defaults, variant: 'ghost', size: 'sm', label: 'Why?' },
}
