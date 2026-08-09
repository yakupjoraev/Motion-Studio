import type { Meta, StoryObj } from '@storybook/react'

import { HeroAppPreview } from './hero-app-preview'
import { heroAppPreviewDefinition } from './hero-app-preview.definition'

const meta = {
  title: 'Blocks/Hero/App preview',
  component: HeroAppPreview,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeroAppPreview>

export default meta

type Story = StoryObj<typeof meta>

/** Defaults: no screenshot, so what shows is the window the block draws in surface tokens. */
export const Default: Story = { args: heroAppPreviewDefinition.defaults }

export const Flat: Story = {
  args: { ...heroAppPreviewDefinition.defaults, tiltX: 0, tiltY: 0 },
}

export const StrongLens: Story = {
  args: { ...heroAppPreviewDefinition.defaults, perspective: 600, tiltY: -18 },
}

export const NoGlow: Story = {
  args: { ...heroAppPreviewDefinition.defaults, glow: false },
}
