import { AlignCenterHIcon, AlignLeftIcon, AlignRightIcon } from '@motion-studio/icons'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { SegmentedField } from './segmented-field'

const meta = {
  title: 'Controls/SegmentedField',
  component: SegmentedField,
  parameters: { layout: 'centered' },
  args: {
    label: 'Direction',
    value: 'row',
    options: [
      { value: 'row', content: 'Row', label: 'Row' },
      { value: 'column', content: 'Column', label: 'Column' },
    ],
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof SegmentedField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <SegmentedField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Icons: Story = {
  args: {
    label: 'Text align',
    value: 'left',
    options: [
      { value: 'left', content: <AlignLeftIcon />, label: 'Align left' },
      { value: 'center', content: <AlignCenterHIcon />, label: 'Align centre' },
      { value: 'right', content: <AlignRightIcon />, label: 'Align right' },
    ],
  },
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <SegmentedField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

/** Nothing selected, because no one node value stands for the rest. */
export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
