import type { Meta, StoryObj } from '@storybook/react'

import { ButtonGroup } from './button-group'
import { buttonGroupDefinition } from './button-group.definition'

const meta: Meta<typeof ButtonGroup> = {
  title: 'Blocks/Interactive/ButtonGroup',
  component: ButtonGroup,
  decorators: [
    (Story) => (
      <div className="bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ButtonGroup>

export const Default: Story = { args: buttonGroupDefinition.defaults }

/** The recessed plate, which is the shape that reads as "one of these" from further away. */
export const Segmented: Story = {
  args: {
    ...buttonGroupDefinition.defaults,
    look: 'segmented',
    items: [
      { label: 'Day', icon: '' },
      { label: 'Week', icon: '' },
      { label: 'Month', icon: '' },
    ],
  },
}

export const MultipleWithGlyphs: Story = {
  args: {
    ...buttonGroupDefinition.defaults,
    mode: 'multiple',
    items: [
      { label: 'Grid', icon: 'layout-grid' },
      { label: 'Rows', icon: 'layout-rows' },
      { label: 'Columns', icon: 'layout-columns' },
    ],
  },
}

/** Nothing selected to begin with, which is what a filter row wants. */
export const StartsEmpty: Story = {
  args: { ...buttonGroupDefinition.defaults, defaultSelected: -1 },
}

export const Sizes: Story = {
  args: buttonGroupDefinition.defaults,
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      <ButtonGroup {...args} size="sm" />
      <ButtonGroup {...args} size="md" />
      <ButtonGroup {...args} size="lg" />
    </div>
  ),
}
