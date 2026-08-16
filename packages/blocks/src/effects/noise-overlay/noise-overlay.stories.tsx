import type { Meta, StoryObj } from '@storybook/react'

import { EffectStage } from '../effect-stage'

import { NoiseOverlay } from './noise-overlay'
import { noiseOverlayDefinition } from './noise-overlay.definition'

const meta: Meta<typeof NoiseOverlay> = {
  title: 'Blocks/Effects/Noise',
  component: NoiseOverlay,
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

type Story = StoryObj<typeof NoiseOverlay>

export const Default: Story = { args: noiseOverlayDefinition.defaults }

export const Preview: Story = { args: noiseOverlayDefinition.previewProps }

/** Soft-light on a light surface: the case a dark-only implementation gets wrong. */
export const SoftLight: Story = {
  args: { ...noiseOverlayDefinition.defaults, blend: 'soft-light', intensity: 0.4 },
}
