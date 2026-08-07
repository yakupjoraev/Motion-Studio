import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { toCss } from './shadow-css'
import { ShadowField } from './shadow-field'

import type { ShadowLayer } from './shadow-field.types'

const SOFT: readonly ShadowLayer[] = [
  { x: 0, y: 2, blur: 4, spread: 0, color: 'oklch(0% 0 0 / 0.06)', inset: false },
  { x: 0, y: 12, blur: 24, spread: 0, color: 'oklch(0% 0 0 / 0.12)', inset: false },
]

const meta = {
  title: 'Controls/ShadowField',
  component: ShadowField,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[280px]',
    label: 'Shadow',
    value: SOFT,
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof ShadowField>

export default meta

type Story = StoryObj<typeof meta>

/** Reorder with the arrow buttons or by dragging the grip; both land in the same value. */
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<readonly ShadowLayer[]>(args.value)

    return (
      <div className="flex w-[280px] flex-col gap-3">
        <ShadowField {...args} value={value} onChange={setValue} onCommit={setValue} />
        <div
          className="h-[80px] w-full rounded-md bg-surface-1"
          style={{ boxShadow: toCss(value) }}
        />
        <p className="break-all text-2xs text-foreground-subtle">{toCss(value)}</p>
      </div>
    )
  },
}

export const Empty: Story = { args: { value: [] } }

export const WithAnInsetHighlight: Story = {
  args: {
    value: [
      ...SOFT,
      { x: 0, y: 1, blur: 0, spread: 0, color: 'oklch(100% 0 0 / 0.08)', inset: true },
    ],
  },
}

export const AtTheCap: Story = { args: { max: 2 } }

export const Disabled: Story = { args: { disabled: true } }
