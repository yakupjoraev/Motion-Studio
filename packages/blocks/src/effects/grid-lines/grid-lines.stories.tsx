import type { Meta, StoryObj } from '@storybook/react'

import { EffectStage } from '../effect-stage'

import { GridLines } from './grid-lines'
import { gridLinesDefinition } from './grid-lines.definition'

const meta: Meta<typeof GridLines> = {
  title: 'Blocks/Effects/Grid lines',
  component: GridLines,
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

type Story = StoryObj<typeof GridLines>

export const Default: Story = { args: gridLinesDefinition.defaults }

export const Preview: Story = { args: gridLinesDefinition.previewProps }

export const HorizontalRules: Story = {
  args: { ...gridLinesDefinition.defaults, axis: 'horizontal', spacing: 24 },
}
