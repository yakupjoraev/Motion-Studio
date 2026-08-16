import type { Meta, StoryObj } from '@storybook/react'

import { EffectStage } from '../effect-stage'

import { Particles } from './particles'
import { particlesDefinition } from './particles.definition'

const meta: Meta<typeof Particles> = {
  title: 'Blocks/Effects/Particles',
  component: Particles,
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

type Story = StoryObj<typeof Particles>

export const Default: Story = { args: particlesDefinition.defaults }

export const Preview: Story = { args: particlesDefinition.previewProps }

/** Another seed is another arrangement — and the same arrangement every time it is rendered. */
export const OtherSeed: Story = { args: { ...particlesDefinition.defaults, seed: 42 } }
