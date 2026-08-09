import type { Meta, StoryObj } from '@storybook/react'

import { Container } from './container'
import { containerDefinition } from './container.definition'

const meta = {
  title: 'Blocks/Layout/Container',
  component: Container,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Container>

export default meta

type Story = StoryObj<typeof meta>

const Card = ({ label }: { readonly label: string }) => (
  <div className="rounded-sm bg-surface-2 px-4 py-6 text-foreground text-sm">{label}</div>
)

const children = (
  <>
    <Card label="One" />
    <Card label="Two" />
    <Card label="Three" />
  </>
)

export const Column: Story = { args: { ...containerDefinition.defaults, children } }

export const Row: Story = {
  args: { ...containerDefinition.defaults, direction: 'row', gap: 'lg', children },
}

/** What the root of every document looks like before anything is dropped into it. */
export const Empty: Story = { args: { ...containerDefinition.defaults, children: null } }
