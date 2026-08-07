import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { TextareaField } from './textarea-field'

const meta = {
  title: 'Controls/TextareaField',
  component: TextareaField,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[240px]',
    label: 'Body',
    value: 'Ship the thing.',
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof TextareaField>

export default meta

type Story = StoryObj<typeof meta>

/** Type past the third line to watch it grow, and past the sixth to watch it stop. */
export const Default: Story = {
  args: { maxRows: 6 },
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <TextareaField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Empty: Story = { args: { value: '', placeholder: 'Body copy' } }

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
