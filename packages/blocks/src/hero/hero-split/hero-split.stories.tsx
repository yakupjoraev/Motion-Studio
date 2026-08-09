import type { Meta, StoryObj } from '@storybook/react'

import { HeroSplit } from './hero-split'
import { heroSplitDefinition } from './hero-split.definition'

const meta = {
  title: 'Blocks/Hero/Split',
  component: HeroSplit,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeroSplit>

export default meta

type Story = StoryObj<typeof meta>

/**
 * A stand-in for whatever the user drops in the slot. It is a story fixture, not part of the block:
 * the block's own default is an empty plate, which is what a user sees before they fill it.
 */
const MediaStandIn = () => (
  <div className="flex h-full w-full items-center justify-center bg-surface-2 text-foreground-subtle text-sm">
    media slot
  </div>
)

export const Default: Story = { args: heroSplitDefinition.defaults }

export const WithMedia: Story = {
  args: { ...heroSplitDefinition.defaults, media: <MediaStandIn /> },
}

export const MediaFirst: Story = {
  args: { ...heroSplitDefinition.defaults, reverse: true, media: <MediaStandIn /> },
}

export const TextWide: Story = {
  args: { ...heroSplitDefinition.defaults, ratio: 'text-wide', media: <MediaStandIn /> },
}

/** No plate: for a media child that already carries its own edge, such as a device mockup. */
export const Unframed: Story = {
  args: {
    ...heroSplitDefinition.defaults,
    mediaFrame: false,
    mediaAspect: 'auto',
    media: <MediaStandIn />,
  },
}
