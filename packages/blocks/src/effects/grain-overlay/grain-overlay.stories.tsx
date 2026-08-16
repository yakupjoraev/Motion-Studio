import type { Meta, StoryObj } from '@storybook/react'

import { EffectStage } from '../effect-stage'

import { GrainOverlay } from './grain-overlay'
import { grainOverlayDefinition } from './grain-overlay.definition'

const meta: Meta<typeof GrainOverlay> = {
  title: 'Blocks/Effects/Film grain',
  component: GrainOverlay,
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

type Story = StoryObj<typeof GrainOverlay>

export const Default: Story = { args: grainOverlayDefinition.defaults }

export const Preview: Story = { args: grainOverlayDefinition.previewProps }

/** The fastest the schema allows — the story the 3 Hz claim is checked against. */
export const Fastest: Story = { args: { ...grainOverlayDefinition.defaults, speed: 3 } }
