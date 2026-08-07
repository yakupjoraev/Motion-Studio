import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { SelectField } from './select-field'

const OPTIONS = [
  { value: 'flex', label: 'flex' },
  { value: 'grid', label: 'grid' },
  { value: 'block', label: 'block' },
  { value: 'contents', label: 'contents', disabled: true },
]

const meta = {
  title: 'Controls/SelectField',
  component: SelectField,
  parameters: { layout: 'centered' },
  args: {
    label: 'Display',
    value: 'flex',
    options: OPTIONS,
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof SelectField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <SelectField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Unset: Story = { args: { value: '', placeholder: 'auto' } }

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
