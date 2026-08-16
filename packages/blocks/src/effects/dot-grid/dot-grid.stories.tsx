import type { Meta, StoryObj } from '@storybook/react'

import { EffectStage } from '../effect-stage'

import { DotGrid } from './dot-grid'
import { dotGridDefinition } from './dot-grid.definition'

const meta: Meta<typeof DotGrid> = {
  title: 'Blocks/Effects/Dot grid',
  component: DotGrid,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <EffectStage>
        <Story />
      </EffectStage>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof DotGrid>

export const Default: Story = { args: dotGridDefinition.defaults }

export const Preview: Story = { args: dotGridDefinition.previewProps }

export const GraphPaper: Story = {
  args: { ...dotGridDefinition.defaults, fade: false, spacing: 12, intensity: 0.2 },
}
