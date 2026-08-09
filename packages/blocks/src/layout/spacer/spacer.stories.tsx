import type { Meta, StoryObj } from '@storybook/react'

import { Spacer } from './spacer'
import { spacerDefinition } from './spacer.definition'

const meta = {
  title: 'Blocks/Layout/Spacer',
  component: Spacer,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Spacer>

export default meta

type Story = StoryObj<typeof meta>

const Marker = ({ label }: { readonly label: string }) => (
  <div className="rounded-sm bg-surface-2 px-4 py-2 text-foreground text-xs">{label}</div>
)

export const Fixed: Story = {
  args: spacerDefinition.previewProps,
  render: (args) => (
    <div className="flex flex-col border border-border border-dashed">
      <Marker label="Above" />
      <Spacer {...args} />
      <Marker label="Below" />
    </div>
  ),
}

/** Fluid only means anything in a flex parent, which is what the block declares — ADR-115. */
export const Fluid: Story = {
  args: { ...spacerDefinition.defaults, mode: 'fluid' },
  render: (args) => (
    <div className="flex h-[240px] flex-col border border-border border-dashed">
      <Marker label="Top" />
      <Spacer {...args} />
      <Marker label="Pushed to the bottom" />
    </div>
  ),
}
