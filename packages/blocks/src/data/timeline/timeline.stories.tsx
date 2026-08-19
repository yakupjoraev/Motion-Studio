import type { Meta, StoryObj } from '@storybook/react'

import { Timeline } from './timeline'
import { timelineDefinition } from './timeline.definition'

const meta: Meta<typeof Timeline> = {
  title: 'Blocks/Data/Timeline',
  component: Timeline,
  decorators: [
    (Story) => (
      <div className="max-w-3xl bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Timeline>

const defaults = timelineDefinition.defaults

export const Default: Story = { args: defaults }

export const NumberedMarkers: Story = {
  args: { ...defaults, marker: 'number' },
}

export const IconMarkers: Story = {
  args: { ...defaults, marker: 'icon' },
}

/** The strip: it snaps, it takes focus, and it scrolls with the arrow keys. */
export const Horizontal: Story = {
  args: { ...defaults, orientation: 'horizontal' },
}

/** A step with a block dropped into it, which replaces that step's own text — ADR-206. */
export const WithSlottedContent: Story = {
  args: defaults,
  render: (args) => (
    <Timeline {...args}>
      <div className="mt-2 rounded-lg border border-border bg-surface-2 p-4 text-base text-foreground-muted">
        Any block can occupy a step, and it replaces the step’s own text.
      </div>
    </Timeline>
  ),
}
