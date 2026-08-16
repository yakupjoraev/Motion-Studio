import type { Meta, StoryObj } from '@storybook/react'

import { EffectStage } from '../effect-stage'

import { Beams } from './beams'
import { beamsDefinition } from './beams.definition'

const meta: Meta<typeof Beams> = {
  title: 'Blocks/Effects/Beams',
  component: Beams,
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

type Story = StoryObj<typeof Beams>

export const Default: Story = { args: beamsDefinition.defaults }

export const Preview: Story = { args: beamsDefinition.previewProps }

export const Wide: Story = { args: { ...beamsDefinition.defaults, width: 140, count: 2, angle: 0 } }
