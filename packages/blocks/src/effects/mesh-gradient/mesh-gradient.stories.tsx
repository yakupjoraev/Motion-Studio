import type { Meta, StoryObj } from '@storybook/react'

import { EffectStage } from '../effect-stage'

import { MeshGradient } from './mesh-gradient'
import { meshGradientDefinition } from './mesh-gradient.definition'

const meta: Meta<typeof MeshGradient> = {
  title: 'Blocks/Effects/Mesh gradient',
  component: MeshGradient,
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

type Story = StoryObj<typeof MeshGradient>

export const Default: Story = { args: meshGradientDefinition.defaults }

export const Preview: Story = { args: meshGradientDefinition.previewProps }

/** Tight stops read as spots, which is the failure mode a spread control exists to avoid. */
export const TightStops: Story = {
  args: { ...meshGradientDefinition.defaults, spread: 25, blur: 0 },
}
