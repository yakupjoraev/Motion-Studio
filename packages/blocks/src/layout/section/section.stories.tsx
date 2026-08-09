import type { Meta, StoryObj } from '@storybook/react'

import { Section } from './section'
import { sectionDefinition } from './section.definition'

const meta = {
  title: 'Blocks/Layout/Section',
  component: Section,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Section>

export default meta

type Story = StoryObj<typeof meta>

const Body = () => (
  <>
    <h2 className="font-semibold text-2xl text-foreground">A band of a page</h2>
    <p className="text-foreground-muted text-sm">Whatever the user drops into the slot.</p>
  </>
)

export const Default: Story = {
  args: { ...sectionDefinition.defaults, children: <Body /> },
}

export const Preview: Story = {
  args: { ...sectionDefinition.previewProps, children: <Body /> },
}

/** The three alignments, which are the measure moving rather than the text. */
export const Centered: Story = {
  args: { ...sectionDefinition.defaults, align: 'center', maxWidth: 'md', children: <Body /> },
}

export const FullHeight: Story = {
  args: {
    ...sectionDefinition.defaults,
    minHeight: 'screen',
    background: 'surface-1',
    children: <Body />,
  },
}
