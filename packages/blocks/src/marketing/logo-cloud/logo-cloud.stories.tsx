import type { Meta, StoryObj } from '@storybook/react'

import { LogoCloud } from './logo-cloud'
import { logoCloudDefinition } from './logo-cloud.definition'

const meta = {
  title: 'Blocks/Marketing/Logo cloud',
  component: LogoCloud,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LogoCloud>

export default meta

type Story = StoryObj<typeof meta>

export const Grid: Story = { args: logoCloudDefinition.defaults }

export const Marquee: Story = { args: { ...logoCloudDefinition.defaults, mode: 'marquee' } }

export const FullColour: Story = { args: { ...logoCloudDefinition.defaults, grayscale: false } }

export const ThreeColumns: Story = { args: { ...logoCloudDefinition.defaults, columns: 3 } }

/** Two marks in marquee mode — the narrow-content case, which the row fills by itself. */
export const TwoMarksScrolling: Story = {
  args: {
    ...logoCloudDefinition.defaults,
    mode: 'marquee',
    logos: logoCloudDefinition.defaults.logos.slice(0, 2),
  },
}
