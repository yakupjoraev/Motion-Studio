import type { Meta, StoryObj } from '@storybook/react'

import { EffectStage } from '../effect-stage'

import { Glow } from './glow'
import { glowDefinition } from './glow.definition'

const meta: Meta<typeof Glow> = {
  title: 'Blocks/Effects/Glow',
  component: Glow,
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

type Story = StoryObj<typeof Glow>

export const Default: Story = { args: glowDefinition.defaults }

export const Preview: Story = { args: glowDefinition.previewProps }

export const Breathing: Story = { args: { ...glowDefinition.defaults, breathe: true } }
