import { MotionSchedulerProvider } from '@motion-studio/motion'
import type { Meta, StoryObj } from '@storybook/react'

import { EffectStage } from '../effect-stage'

import { Spotlight } from './spotlight'
import { spotlightDefinition } from './spotlight.definition'

const meta: Meta<typeof Spotlight> = {
  title: 'Blocks/Effects/Spotlight',
  component: Spotlight,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MotionSchedulerProvider>
        <EffectStage>
          <Story />
        </EffectStage>
      </MotionSchedulerProvider>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Spotlight>

export const Default: Story = { args: spotlightDefinition.defaults }

export const Preview: Story = { args: spotlightDefinition.previewProps }

/** What a touch device and a keyboard user see, which has to look deliberate. */
export const Centred: Story = {
  args: { ...spotlightDefinition.defaults, followPointer: false, intensity: 0.45 },
}
