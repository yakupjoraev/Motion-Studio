import type { Meta, StoryObj } from '@storybook/react'

import { CtaSplit } from './cta-split'
import { ctaSplitDefinition } from './cta-split.definition'

const meta = {
  title: 'Blocks/Marketing/CTA split',
  component: CtaSplit,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CtaSplit>

export default meta

type Story = StoryObj<typeof meta>

export const WithForm: Story = { args: ctaSplitDefinition.defaults }

export const WithButtons: Story = { args: { ...ctaSplitDefinition.defaults, side: 'buttons' } }

export const Glass: Story = { args: { ...ctaSplitDefinition.defaults, surface: 'glass' } }

/** No panel at all — the band a page uses when the section around it already has one. */
export const Plain: Story = { args: { ...ctaSplitDefinition.defaults, surface: 'plain' } }
