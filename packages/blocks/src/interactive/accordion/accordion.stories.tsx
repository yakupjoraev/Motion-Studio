import type { Meta, StoryObj } from '@storybook/react'

import { Accordion } from './accordion'
import { accordionDefinition } from './accordion.definition'

const meta: Meta<typeof Accordion> = {
  title: 'Blocks/Interactive/Accordion',
  component: Accordion,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl bg-surface-0 p-8">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Accordion>

export const Default: Story = { args: accordionDefinition.defaults }

/** Separate surfaces, for panels that are not a list of one thing. */
export const Cards: Story = {
  args: { ...accordionDefinition.defaults, look: 'cards' },
}

export const SeveralOpenAtOnce: Story = {
  args: { ...accordionDefinition.defaults, mode: 'multiple' },
}

export const StartsClosed: Story = {
  args: { ...accordionDefinition.defaults, defaultOpen: -1 },
}

export const WithGlyphs: Story = {
  args: {
    ...accordionDefinition.defaults,
    items: [
      { label: 'Canvas', icon: 'grid', body: 'Zoom, pan, snap and guides.' },
      { label: 'Motion', icon: 'zap', body: 'One spec per channel, composed rather than stacked.' },
      { label: 'Export', icon: 'export', body: 'React, Next, or plain HTML.' },
    ],
  },
}

/** A block in the first panel; the rows below keep their own text — ADR-206. */
export const WithAChildInOnePanel: Story = {
  args: accordionDefinition.defaults,
  render: (args) => (
    <Accordion {...args}>
      <div className="rounded-lg border border-border bg-surface-2 p-4 text-base text-foreground">
        A block dropped into the first panel
      </div>
    </Accordion>
  ),
}
