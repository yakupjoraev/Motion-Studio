import type { Meta, StoryObj } from '@storybook/react'

import { HeroVideo } from './hero-video'
import { heroVideoDefinition } from './hero-video.definition'

const meta = {
  title: 'Blocks/Hero/Video',
  component: HeroVideo,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeroVideo>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Defaults, which means no footage. The repository ships no video asset, and a story that pointed at
 * one would be judging a clip rather than a block — so what these stories show is the state a user
 * sees before they attach anything, plus the scrim steps that decide legibility once they do.
 */
export const Default: Story = { args: heroVideoDefinition.defaults }

export const SoftScrim: Story = { args: { ...heroVideoDefinition.defaults, scrim: 'soft' } }

export const MediumScrim: Story = { args: { ...heroVideoDefinition.defaults, scrim: 'medium' } }

export const LeftAligned: Story = {
  args: { ...heroVideoDefinition.defaults, align: 'start' },
}
