import type { Meta, StoryObj } from '@storybook/react'

import { Table } from './table'
import { tableDefinition } from './table.definition'
import type { TableRow } from './table.schema'

const meta: Meta<typeof Table> = {
  title: 'Blocks/Data/Table',
  component: Table,
  decorators: [
    (Story) => (
      <div className="bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Table>

const TARGETS = ['React', 'Next.js', 'HTML', 'JSON'] as const

/** Fifty rows, which is the cap and the size the manual sort and scroll pass is run at. */
const manyRows: readonly TableRow[] = Array.from({ length: 50 }, (_, index) => ({
  cells: [
    `document-${String(index + 1).padStart(2, '0')}.motion`,
    TARGETS[index % TARGETS.length] ?? 'React',
    String(4 + ((index * 7) % 60)),
    `${(0.2 + ((index * 13) % 40) / 10).toFixed(1)}s`,
    index % 9 === 0 ? 'Failed' : 'Complete',
  ],
}))

export const Default: Story = { args: tableDefinition.defaults }

export const Compact: Story = {
  args: { ...tableDefinition.defaults, density: 'compact' },
}

export const Comfortable: Story = {
  args: { ...tableDefinition.defaults, density: 'comfortable', zebra: false },
}

export const FiftyRows: Story = {
  args: { ...tableDefinition.defaults, rows: [...manyRows] },
  decorators: [
    (Story) => (
      <div className="h-[32rem] overflow-y-auto bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

/** The empty state, which lives inside the body and spans every column. */
export const Empty: Story = {
  args: { ...tableDefinition.defaults, rows: [] },
}

/** A caption the reader can see, rather than one only a screen reader gets. */
export const VisibleCaption: Story = {
  args: { ...tableDefinition.defaults, showCaption: true },
}
