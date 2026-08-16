import type { Meta, StoryObj } from '@storybook/react'

import { EffectStage } from '../effect-stage'

import { AuroraBackground } from './aurora-background'
import { auroraBackgroundDefinition } from './aurora-background.definition'

const meta: Meta<typeof AuroraBackground> = {
  title: 'Blocks/Effects/Aurora',
  component: AuroraBackground,
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

type Story = StoryObj<typeof AuroraBackground>

export const Default: Story = { args: auroraBackgroundDefinition.defaults }

export const Preview: Story = { args: auroraBackgroundDefinition.previewProps }

/** The contrast case: real text over the effect at full intensity, which is where most fail. */
export const OverText: Story = {
  args: { ...auroraBackgroundDefinition.defaults, intensity: 1 },
}
