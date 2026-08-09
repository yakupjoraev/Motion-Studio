import type { Meta, StoryObj } from '@storybook/react'

import { CodeBlock } from './code-block'
import { codeBlockDefinition } from './code-block.definition'

const meta = {
  title: 'Blocks/Content/Code block',
  component: CodeBlock,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CodeBlock>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: codeBlockDefinition.defaults }

export const WithHighlightedLines: Story = {
  args: { ...codeBlockDefinition.defaults, highlightLines: '4' },
}

export const Shell: Story = {
  args: {
    ...codeBlockDefinition.defaults,
    language: 'bash',
    filename: '',
    showLineNumbers: false,
    code: 'npx motion-studio export --target next\n# Wrote 12 components · 4 routes · 1 theme',
  },
}

/** A sample wider than its column, which is what makes the focusable scroller matter. */
export const Overflowing: Story = {
  args: {
    ...codeBlockDefinition.defaults,
    code: `export const config = { headline: 'A line long enough to overflow any reasonable column width in a documentation page', tone: 'muted' }`,
  },
}
