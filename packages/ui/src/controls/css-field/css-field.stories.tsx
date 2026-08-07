import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { CssField } from './css-field'

const meta = {
  title: 'Controls/CssField',
  component: CssField,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[280px]',
    label: 'Custom CSS',
    value: 'letter-spacing: -0.01em;\ntext-wrap: balance;',
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof CssField>

export default meta

type Story = StoryObj<typeof meta>

/** Type a selector or an `@import` to see the reason appear under the field. */
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <CssField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Empty: Story = { args: { value: '' } }

export const Invalid: Story = { args: { value: '.card { color: red }\nopacity 0.5' } }

export const NarrowedToAFewProperties: Story = {
  args: { value: 'color: red;', properties: ['opacity', 'letter-spacing'] },
}

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
