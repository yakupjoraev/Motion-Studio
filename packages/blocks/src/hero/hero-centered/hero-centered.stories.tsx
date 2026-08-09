import type { Meta, StoryObj } from '@storybook/react'

import { HeroCentered } from './hero-centered'
import { heroCenteredDefinition } from './hero-centered.definition'

const meta = {
  title: 'Blocks/Hero/Centered',
  component: HeroCentered,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeroCentered>

export default meta

type Story = StoryObj<typeof meta>

/** Defaults only. This is the story the block is judged in — nothing here is arranged for it. */
export const Default: Story = { args: heroCenteredDefinition.defaults }

export const OnASurface: Story = {
  args: { ...heroCenteredDefinition.defaults, background: 'surface-1' },
}

/** No eyebrow, no trust row, one button: the shortest form the rhythm still has to hold in. */
export const Minimal: Story = {
  args: {
    ...heroCenteredDefinition.defaults,
    eyebrow: '',
    trust: [],
    actions: [{ label: 'Start building', href: '#', variant: 'primary' }],
  },
}

export const LeftAligned: Story = {
  args: { ...heroCenteredDefinition.defaults, align: 'start' },
}
