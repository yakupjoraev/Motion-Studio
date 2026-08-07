import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { TextField } from './text-field'

const meta = {
  title: 'Controls/TextField',
  component: TextField,
  parameters: { layout: 'centered' },
  args: {
    label: 'Name',
    value: 'Hero section',
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof TextField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <TextField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Empty: Story = { args: { value: '', placeholder: 'Untitled' } }

export const Mixed: Story = { args: { mixed: true } }

export const Invalid: Story = { args: { value: 'has a space', invalid: true } }

export const Disabled: Story = { args: { disabled: true } }
