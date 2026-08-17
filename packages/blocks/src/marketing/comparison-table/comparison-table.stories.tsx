import type { Meta, StoryObj } from '@storybook/react'

import { ComparisonTable } from './comparison-table'
import { comparisonTableDefinition } from './comparison-table.definition'

const meta = {
  title: 'Blocks/Marketing/Comparison table',
  component: ComparisonTable,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ComparisonTable>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: comparisonTableDefinition.defaults }

export const NothingHighlighted: Story = {
  args: {
    ...comparisonTableDefinition.defaults,
    columns: comparisonTableDefinition.defaults.columns.map((column) => ({
      ...column,
      highlighted: false,
    })),
  },
}

/** Five columns and sixteen rows: the case where both sticky axes have to work at once. */
export const WideAndTall: Story = {
  args: {
    ...comparisonTableDefinition.defaults,
    columns: [
      { label: 'Motion Studio', highlighted: true },
      { label: 'Design tool', highlighted: false },
      { label: 'Page builder', highlighted: false },
      { label: 'Hand-written', highlighted: false },
      { label: 'Component kit', highlighted: false },
    ],
    rows: Array.from({ length: 16 }, (_unused, index) => ({
      label: `Feature number ${index + 1}`,
      values: ['yes', 'no', index % 2 === 0 ? 'Partly' : 'no', 'yes', 'no'],
    })),
  },
}
