import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { AlignField } from './align-field'

const meta = {
  title: 'Controls/AlignField',
  component: AlignField,
  parameters: { layout: 'centered' },
  args: {
    label: 'Align',
    value: { horizontal: 'center', vertical: 'center' },
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof AlignField>

export default meta

type Story = StoryObj<typeof meta>

/** Tab in and walk the grid with the arrows: selection follows focus, and the edges do not wrap. */
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return (
      <div className="flex items-center gap-3">
        <AlignField {...args} value={value} onChange={setValue} onCommit={setValue} />
        <p className="text-2xs text-foreground-subtle">
          {value.vertical} / {value.horizontal}
        </p>
      </div>
    )
  },
}

export const Corner: Story = { args: { value: { horizontal: 'end', vertical: 'start' } } }

export const Disabled: Story = { args: { disabled: true } }
