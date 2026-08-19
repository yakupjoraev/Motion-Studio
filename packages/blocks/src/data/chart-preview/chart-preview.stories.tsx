import type { Meta, StoryObj } from '@storybook/react'

import { ChartPreview } from './chart-preview'
import { chartPreviewDefinition } from './chart-preview.definition'

const meta: Meta<typeof ChartPreview> = {
  title: 'Blocks/Data/ChartPreview',
  component: ChartPreview,
  decorators: [
    (Story) => (
      <div className="max-w-2xl bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ChartPreview>

const defaults = chartPreviewDefinition.defaults

export const Default: Story = { args: defaults }

export const Line: Story = { args: { ...defaults, kind: 'line' } }

export const Bars: Story = { args: { ...defaults, kind: 'bar' } }

export const Tones: Story = {
  args: defaults,
  render: (args) => (
    <div className="flex flex-col gap-8">
      <ChartPreview {...args} caption="Accent" tone="accent" />
      <ChartPreview {...args} caption="Success" tone="success" />
      <ChartPreview {...args} caption="Danger" tone="danger" />
    </div>
  ),
}

/** A falling series, which the computed summary has to describe as falling rather than as growth. */
export const Falling: Story = {
  args: {
    ...defaults,
    series: [84, 71, 66, 48, 30, 18],
    seriesLabel: 'Open defects',
    tone: 'success',
    caption: 'Open defects, six weeks',
  },
}

/** A flat series: no range to normalise against, so the line sits on the centre rather than dividing by zero. */
export const Flat: Story = {
  args: { ...defaults, kind: 'line', series: [40, 40, 40, 40, 40, 40] },
}

export const Tall: Story = { args: { ...defaults, height: 'lg' } }
