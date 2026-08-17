import type { Meta, StoryObj } from '@storybook/react'

import { FeatureGrid } from './feature-grid'
import { featureGridDefinition } from './feature-grid.definition'

const meta = {
  title: 'Blocks/Marketing/Feature grid',
  component: FeatureGrid,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FeatureGrid>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: featureGridDefinition.defaults }

export const Preview: Story = { args: featureGridDefinition.previewProps }

/** Two columns and no card: the arrangement a page uses when the features are the whole section. */
export const PlainTwoColumn: Story = {
  args: { ...featureGridDefinition.defaults, columns: 2, treatment: 'plain' },
}

export const FourColumn: Story = {
  args: { ...featureGridDefinition.defaults, columns: 4 },
}

export const Glass: Story = {
  args: { ...featureGridDefinition.defaults, treatment: 'glass' },
}

/** No header at all — the content starts flush, which is what a section under a hero wants. */
export const HeaderCleared: Story = {
  args: { ...featureGridDefinition.defaults, eyebrow: '', heading: '', description: '' },
}
