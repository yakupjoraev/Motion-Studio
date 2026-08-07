import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Slider } from './slider'

const meta = {
  title: 'Chrome/Slider',
  component: Slider,
  parameters: { layout: 'centered' },
  // The width comes from an arg rather than a decorator: a decorator makes `meta`'s inferred type reach
  // into Storybook's internals, and `tsc` then refuses to name it.
  args: { 'aria-label': 'Opacity', className: 'w-[200px]' },
} satisfies Meta<typeof Slider>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { defaultValue: 72 } }

export const Empty: Story = { args: { defaultValue: 0 } }

export const Full: Story = { args: { defaultValue: 100 } }

export const Stepped: Story = {
  args: { min: 0, max: 64, step: 8, defaultValue: 16, 'aria-valuetext': '16 pixels' },
}

export const Disabled: Story = { args: { defaultValue: 40, disabled: true } }

/** The inspector's `slider` control kind is "Slider + number", so this is how it actually appears. */
export const InAControlRow: Story = {
  render: () => {
    const [value, setValue] = useState(72)

    return (
      <div className="flex h-[28px] w-[280px] items-center gap-2 px-2">
        <span className="w-[88px] text-xs text-foreground-muted">Opacity</span>
        <Slider
          aria-label="Opacity"
          value={value}
          onValueChange={setValue}
          aria-valuetext={`${value} percent`}
        />
        <span className="w-[32px] text-right text-xs text-foreground tabular-nums">{value}</span>
      </div>
    )
  },
}
