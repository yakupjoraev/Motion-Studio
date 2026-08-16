import type { Meta, StoryObj } from '@storybook/react'

import { Shine } from './shine'
import { shineDefinition } from './shine.definition'

const meta: Meta<typeof Shine> = {
  title: 'Blocks/Effects/Shine',
  component: Shine,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="relative isolate flex h-40 w-80 items-center justify-center overflow-hidden rounded-lg bg-surface-2">
        <Story />
        <span className="relative z-10 text-foreground text-sm">A surface catching the light</span>
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Shine>

export const Default: Story = { args: shineDefinition.defaults }

export const Preview: Story = { args: shineDefinition.previewProps }

export const Vertical: Story = { args: { ...shineDefinition.defaults, angle: 0, width: 25 } }
