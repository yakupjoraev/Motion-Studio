import type { Meta, StoryObj } from '@storybook/react'

import { BorderBeam } from './border-beam'
import { borderBeamDefinition } from './border-beam.definition'

const meta: Meta<typeof BorderBeam> = {
  title: 'Blocks/Effects/Border beam',
  component: BorderBeam,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="relative isolate flex h-40 w-80 items-center justify-center rounded-lg border border-border bg-surface-1">
        <Story />
        <span className="relative z-10 text-foreground text-sm">A card with a lit border</span>
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof BorderBeam>

export const Default: Story = { args: borderBeamDefinition.defaults }

export const Preview: Story = { args: borderBeamDefinition.previewProps }

/** A long arc stops being a comet and becomes a rotating gradient, which is a different thing. */
export const LongArc: Story = { args: { ...borderBeamDefinition.defaults, arc: 180 } }
