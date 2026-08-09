import type { Meta, StoryObj } from '@storybook/react'

import { Divider } from './divider'
import { dividerDefinition } from './divider.definition'

const meta = {
  title: 'Blocks/Layout/Divider',
  component: Divider,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Divider>

export default meta

type Story = StoryObj<typeof meta>

export const Plain: Story = { args: dividerDefinition.defaults }

/** The line-text-line composition, which is the reason this block has a label prop at all. */
export const Labelled: Story = { args: dividerDefinition.previewProps }

export const Dashed: Story = { args: { ...dividerDefinition.defaults, lineStyle: 'dashed' } }
