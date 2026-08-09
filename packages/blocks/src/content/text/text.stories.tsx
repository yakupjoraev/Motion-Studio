import type { Meta, StoryObj } from '@storybook/react'

import { Text } from './text'
import { textDefinition } from './text.definition'

const meta = {
  title: 'Blocks/Content/Text',
  component: Text,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Text>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: textDefinition.defaults }

export const Lead: Story = {
  args: { ...textDefinition.defaults, size: 'xl', tone: 'default', measure: 'narrow' },
}

/** The comparison that makes the default worth having: the same words, uncapped. */
export const FullWidth: Story = { args: { ...textDefinition.defaults, measure: 'full' } }

export const TwoColumns: Story = {
  args: { ...textDefinition.defaults, columns: 2, measure: 'full' },
}

export const WithDropCap: Story = { args: { ...textDefinition.defaults, dropCap: true } }
