import type { Meta, StoryObj } from '@storybook/react'

import { Columns } from './columns'
import { columnsDefinition } from './columns.definition'

const meta = {
  title: 'Blocks/Layout/Columns',
  component: Columns,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Columns>

export default meta

type Story = StoryObj<typeof meta>

const Panel = ({ label }: { readonly label: string }) => (
  <div className="rounded-sm bg-surface-2 px-4 py-10 text-center text-foreground text-sm">
    {label}
  </div>
)

export const Even: Story = {
  args: {
    ...columnsDefinition.defaults,
    left: <Panel label="Left" />,
    right: <Panel label="Right" />,
  },
}

export const Asymmetric: Story = {
  args: {
    ...columnsDefinition.previewProps,
    left: <Panel label="Two thirds" />,
    right: <Panel label="One third" />,
  },
}

/** On a phone the right column reads first — a prop, so the export says so in one class. */
export const ReversedOnMobile: Story = {
  args: {
    ...columnsDefinition.defaults,
    reverseOnMobile: true,
    left: <Panel label="Text" />,
    right: <Panel label="Image" />,
  },
}
