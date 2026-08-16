import type { Meta, StoryObj } from '@storybook/react'

import { EffectStage } from '../effect-stage'

import { Scanlines } from './scanlines'
import { scanlinesDefinition } from './scanlines.definition'

const meta: Meta<typeof Scanlines> = {
  title: 'Blocks/Effects/Scanlines',
  component: Scanlines,
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

type Story = StoryObj<typeof Scanlines>

export const Default: Story = { args: scanlinesDefinition.defaults }

export const Preview: Story = { args: scanlinesDefinition.previewProps }

export const Drifting: Story = { args: { ...scanlinesDefinition.defaults, drift: true } }
