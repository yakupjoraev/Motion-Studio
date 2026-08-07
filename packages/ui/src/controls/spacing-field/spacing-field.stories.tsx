import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { toCss } from './spacing-css'
import { SpacingField } from './spacing-field'

const meta = {
  title: 'Controls/SpacingField',
  component: SpacingField,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[240px]',
    label: 'Padding',
    value: { top: 8, right: 8, bottom: 8, left: 8 },
    min: 0,
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof SpacingField>

export default meta

type Story = StoryObj<typeof meta>

/** The readout is the CSS the value round-trips through — ADR-040. */
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return (
      <div className="flex flex-col gap-2">
        <SpacingField {...args} value={value} onChange={setValue} onCommit={setValue} />
        <p className="text-2xs text-foreground-subtle">padding: {toCss(value)}</p>
      </div>
    )
  },
}

export const Unlinked: Story = {
  args: { linked: false, value: { top: 4, right: 12, bottom: 4, left: 12 } },
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <SpacingField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
