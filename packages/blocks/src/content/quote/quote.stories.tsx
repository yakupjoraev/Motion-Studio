import type { Meta, StoryObj } from '@storybook/react'

import { Quote } from './quote'
import { quoteDefinition } from './quote.definition'

const meta = {
  title: 'Blocks/Content/Quote',
  component: Quote,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Quote>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: quoteDefinition.defaults }

export const WithGlyph: Story = { args: { ...quoteDefinition.defaults, mark: 'glyph', size: 'xl' } }

export const Unmarked: Story = { args: { ...quoteDefinition.defaults, mark: 'none' } }

export const Centred: Story = {
  args: { ...quoteDefinition.defaults, align: 'center', mark: 'none', size: 'xl' },
}

/** No attribution at all: the caption disappears rather than leaving an empty row. */
export const Unattributed: Story = {
  args: { ...quoteDefinition.defaults, author: '', role: '' },
}
