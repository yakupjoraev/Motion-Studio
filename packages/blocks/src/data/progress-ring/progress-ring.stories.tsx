import type { Meta, StoryObj } from '@storybook/react'

import { ProgressRing } from './progress-ring'
import { progressRingDefinition } from './progress-ring.definition'

const meta: Meta<typeof ProgressRing> = {
  title: 'Blocks/Data/ProgressRing',
  component: ProgressRing,
  decorators: [
    (Story) => (
      <div className="flex items-start gap-10 bg-surface-0 p-8">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ProgressRing>

const defaults = progressRingDefinition.defaults

export const Default: Story = { args: defaults }

export const Sizes: Story = {
  args: defaults,
  render: (args) => (
    <>
      <ProgressRing {...args} caption="Small" size="sm" />
      <ProgressRing {...args} caption="Medium" size="md" />
      <ProgressRing {...args} caption="Large" size="lg" />
    </>
  ),
}

export const Weights: Story = {
  args: defaults,
  render: (args) => (
    <>
      <ProgressRing {...args} caption="Thin" weight="thin" />
      <ProgressRing {...args} caption="Regular" weight="regular" />
      <ProgressRing {...args} caption="Thick" weight="thick" />
    </>
  ),
}

/** The ends of the range, which are the two the arc has to draw exactly. */
export const Extremes: Story = {
  args: defaults,
  render: (args) => (
    <>
      <ProgressRing {...args} caption="Nothing yet" value={0} />
      <ProgressRing {...args} caption="Finished" value={100} />
    </>
  ),
}

/** A range that is a count rather than a proportion, which is what `valueText` exists for. */
export const CountedRange: Story = {
  args: {
    ...defaults,
    label: 'Blocks migrated',
    caption: 'Blocks migrated',
    min: 0,
    max: 62,
    value: 42,
    valueUnit: '',
    valueText: '42 of 62 blocks migrated',
  },
}

export const WithoutFigure: Story = {
  args: { ...defaults, showValue: false },
}
