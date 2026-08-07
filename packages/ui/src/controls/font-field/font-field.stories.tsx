import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { toCss } from './font-css'
import { FontField } from './font-field'

import type { FontValue } from './font-field.types'

const meta = {
  title: 'Controls/FontField',
  component: FontField,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[280px]',
    label: 'Type',
    value: { family: 'var(--ms-font-sans)', size: 16, weight: 400, tracking: 0 },
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof FontField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<FontValue>(args.value)

    return (
      <div className="flex w-[280px] flex-col gap-2">
        <FontField {...args} value={value} onChange={setValue} onCommit={setValue} />
        <p
          style={{
            fontFamily: value.family,
            fontSize: value.size,
            fontWeight: value.weight,
            letterSpacing: `${value.tracking}em`,
          }}
        >
          The quick brown fox
        </p>
        <p className="break-all text-2xs text-foreground-subtle">{toCss(value)}</p>
      </div>
    )
  },
}

export const Display: Story = {
  args: { value: { family: 'var(--ms-font-sans)', size: 48, weight: 700, tracking: -0.02 } },
}

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
