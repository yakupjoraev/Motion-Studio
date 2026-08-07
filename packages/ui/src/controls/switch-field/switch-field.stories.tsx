import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { SwitchField } from './switch-field'

const meta = {
  title: 'Controls/SwitchField',
  component: SwitchField,
  parameters: { layout: 'centered' },
  args: {
    label: 'Clip content',
    value: true,
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof SwitchField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <SwitchField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

/** The hint says what the property does in CSS terms, which is what the panel is short of room for. */
export const WithAHint: Story = { args: { hint: 'overflow: hidden' } }

/** Off, and Mixed only in the description: `role="switch"` has no third state. */
export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
