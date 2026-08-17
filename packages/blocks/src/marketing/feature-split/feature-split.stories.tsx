import type { Meta, StoryObj } from '@storybook/react'

import { FeatureSplit } from './feature-split'
import { featureSplitDefinition } from './feature-split.definition'

const meta = {
  title: 'Blocks/Marketing/Feature split',
  component: FeatureSplit,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FeatureSplit>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: featureSplitDefinition.defaults }

export const Preview: Story = { args: featureSplitDefinition.previewProps }

/** Alternation off: every row the same way round, which suits two rows and not five. */
export const SameSide: Story = {
  args: { ...featureSplitDefinition.defaults, alternate: false },
}

/** One row flipped against an alternating section — the per-row exception. */
export const RowFlipped: Story = {
  args: {
    ...featureSplitDefinition.defaults,
    rows: featureSplitDefinition.defaults.rows.map((row, index) =>
      index === 0 ? { ...row, reversed: true } : row,
    ),
  },
}
