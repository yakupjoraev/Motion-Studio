import { parseRichText } from '@motion-studio/schema'
import type { Meta, StoryObj } from '@storybook/react'

import { RichText } from './rich-text'
import { richTextDefinition } from './rich-text.definition'

const meta = {
  title: 'Blocks/Content/Rich text',
  component: RichText,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof RichText>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: richTextDefinition.defaults }

export const WithLists: Story = {
  args: {
    ...richTextDefinition.defaults,
    content: parseRichText(
      '<p>The restricted set, in full:</p>' +
        '<ul><li><strong>Bold</strong> and <em>italic</em></li><li><code>Inline code</code></li>' +
        '<li>A <a href="/docs">link</a></li></ul>' +
        '<p>And ordered lists:</p><ol><li>Parse</li><li>Store</li><li>Render</li></ol>',
    ),
  },
}

/**
 * What a paste of hostile markup becomes. The value here went through the same parser a paste does,
 * so the story is the answer rather than an illustration of it.
 */
export const AfterAHostilePaste: Story = {
  args: {
    ...richTextDefinition.defaults,
    content: parseRichText(
      '<p onclick="steal()">Text survives. <script>alert(1)</script>' +
        '<a href="javascript:alert(1)">This link lost its href</a>, ' +
        '<strong>this stayed bold</strong>.</p>',
    ),
  },
}
