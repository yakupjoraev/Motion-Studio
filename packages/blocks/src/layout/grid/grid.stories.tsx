import type { Meta, StoryObj } from '@storybook/react'

import { Grid } from './grid'
import { gridDefinition } from './grid.definition'

const meta = {
  title: 'Blocks/Layout/Grid',
  component: Grid,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Grid>

export default meta

type Story = StoryObj<typeof meta>

const cards = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map((label) => (
  <div
    className="rounded-sm bg-surface-2 px-4 py-8 text-center text-foreground text-sm"
    key={label}
  >
    Card {label}
  </div>
))

export const Explicit: Story = { args: { ...gridDefinition.defaults, children: cards } }

/** The mode most users want: columns that wrap at a width rather than at a breakpoint. */
export const AutoFit: Story = { args: { ...gridDefinition.previewProps, children: cards } }

export const Dense: Story = {
  args: { ...gridDefinition.defaults, dense: true, columns: 4, children: cards },
}
