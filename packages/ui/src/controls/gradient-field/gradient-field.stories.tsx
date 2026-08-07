import { GRADIENT } from '@motion-studio/tokens'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { toCss } from './gradient-css'
import { GradientField } from './gradient-field'

import type { Gradient } from '@motion-studio/tokens'

const meta = {
  title: 'Controls/GradientField',
  component: GradientField,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[280px]',
    label: 'Background',
    value: GRADIENT.sunset.gradient,
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof GradientField>

export default meta

type Story = StoryObj<typeof meta>

/** The preview below is the CSS the value round-trips through — ADR-040. */
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<Gradient>(args.value)

    return (
      <div className="flex w-[280px] flex-col gap-2">
        <GradientField {...args} value={value} onChange={setValue} onCommit={setValue} />
        <div
          className="h-[80px] w-full rounded-sm border border-border"
          style={{ backgroundImage: toCss(value) }}
        />
        <p className="break-all text-2xs text-foreground-subtle">{toCss(value)}</p>
      </div>
    )
  },
}

export const Radial: Story = {
  args: {
    value: {
      kind: 'radial',
      shape: 'circle',
      at: { x: 30, y: 30 },
      stops: GRADIENT.ocean.gradient.kind === 'linear' ? GRADIENT.ocean.gradient.stops : [],
    },
  },
  render: (args) => {
    const [value, setValue] = useState<Gradient>(args.value)

    return <GradientField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Conic: Story = { args: { value: GRADIENT.cyber.gradient } }

/** Mesh is a preset. The editor shows it and says so rather than pretending to edit it — ADR-044. */
export const Mesh: Story = { args: { value: GRADIENT.aurora.gradient } }

export const OneKindOnly: Story = { args: { kinds: ['linear'] } }

export const Disabled: Story = { args: { disabled: true } }
