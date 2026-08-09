import type { Meta, StoryObj } from '@storybook/react'

import { HeroAurora } from './hero-aurora'
import { heroAuroraDefinition } from './hero-aurora.definition'

const meta = {
  title: 'Blocks/Hero/Aurora',
  component: HeroAurora,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeroAurora>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: heroAuroraDefinition.defaults }

export const Ember: Story = { args: { ...heroAuroraDefinition.defaults, palette: 'ember' } }

export const Nordic: Story = { args: { ...heroAuroraDefinition.defaults, palette: 'nordic' } }

export const Vivid: Story = {
  args: { ...heroAuroraDefinition.defaults, intensity: 'vivid', noise: 'light' },
}

/**
 * What reduced motion sees. The toolbar toggle produces the same thing through the duration token —
 * this story is here so the still composition can be judged without hunting for the toggle.
 */
export const DriftOff: Story = { args: { ...heroAuroraDefinition.defaults, drift: false } }
