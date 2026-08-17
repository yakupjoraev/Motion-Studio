import type { Meta, StoryObj } from '@storybook/react'

import { CtaBanner } from './cta-banner'
import { ctaBannerDefinition } from './cta-banner.definition'

const meta = {
  title: 'Blocks/Marketing/CTA banner',
  component: CtaBanner,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CtaBanner>

export default meta

type Story = StoryObj<typeof meta>

export const Gradient: Story = { args: ctaBannerDefinition.defaults }

export const FlatAccent: Story = { args: { ...ctaBannerDefinition.defaults, surface: 'accent' } }

export const Glass: Story = { args: { ...ctaBannerDefinition.defaults, surface: 'glass' } }

export const Quiet: Story = { args: { ...ctaBannerDefinition.defaults, surface: 'surface' } }

export const LeftAligned: Story = { args: { ...ctaBannerDefinition.defaults, align: 'start' } }

export const OneButton: Story = {
  args: {
    ...ctaBannerDefinition.defaults,
    actions: ctaBannerDefinition.defaults.actions.slice(0, 1),
  },
}
