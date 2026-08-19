import type { Meta, StoryObj } from '@storybook/react'

import { StatGrid } from './stat-grid'
import { statGridDefinition } from './stat-grid.definition'

const meta: Meta<typeof StatGrid> = {
  title: 'Blocks/Data/StatGrid',
  component: StatGrid,
  decorators: [
    (Story) => (
      <div className="bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof StatGrid>

export const Default: Story = { args: statGridDefinition.defaults }

/** No plate: the figures sit on the page, which is the other half of the `dividers` prop. */
export const Undivided: Story = {
  args: { ...statGridDefinition.defaults, dividers: false },
}

export const ThreeColumns: Story = {
  args: {
    ...statGridDefinition.defaults,
    columns: 3,
    items: statGridDefinition.defaults.items.slice(0, 3),
  },
}

export const Centred: Story = {
  args: { ...statGridDefinition.defaults, align: 'center', columns: 2 },
}

/** A narrow column, which is what the container query is for: the change drops under the figure. */
export const NarrowCells: Story = {
  args: statGridDefinition.defaults,
  decorators: [
    (Story) => (
      <div className="w-[26rem] bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}
