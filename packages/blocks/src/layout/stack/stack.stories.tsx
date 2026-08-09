import type { Meta, StoryObj } from '@storybook/react'

import { Stack } from './stack'
import { stackDefinition } from './stack.definition'

const meta = {
  title: 'Blocks/Layout/Stack',
  component: Stack,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Stack>

export default meta

type Story = StoryObj<typeof meta>

const items = (
  <>
    <span className="py-2 text-foreground text-sm">First</span>
    <span className="py-2 text-foreground text-sm">Second</span>
    <span className="py-2 text-foreground text-sm">Third</span>
  </>
)

export const Vertical: Story = { args: { ...stackDefinition.defaults, children: items } }

export const Horizontal: Story = {
  args: { ...stackDefinition.defaults, direction: 'horizontal', gap: 'lg', children: items },
}

/** The reason a stack exists beside a container: a rule between the items. */
export const Divided: Story = { args: { ...stackDefinition.previewProps, children: items } }
