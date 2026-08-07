import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { toCss } from './radius-css'
import { RadiusField } from './radius-field'

const meta = {
  title: 'Controls/RadiusField',
  component: RadiusField,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[240px]',
    label: 'Radius',
    value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof RadiusField>

export default meta

type Story = StoryObj<typeof meta>

/** A live corner preview alongside the readout: the value is easier to check by shape than by number. */
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return (
      <div className="flex flex-col gap-2">
        <RadiusField {...args} value={value} onChange={setValue} onCommit={setValue} />
        <div
          className="h-[64px] w-full border border-border bg-surface-2"
          style={{ borderRadius: toCss(value) }}
        />
        <p className="text-2xs text-foreground-subtle">border-radius: {toCss(value)}</p>
      </div>
    )
  },
}

export const Unlinked: Story = {
  args: { linked: false, value: { topLeft: 16, topRight: 0, bottomRight: 16, bottomLeft: 0 } },
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <RadiusField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
