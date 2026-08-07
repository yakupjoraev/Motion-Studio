import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import type { ColorTokenPreset, ColorValue } from '../color-picker/index'
import { ColorField } from './color-field'

const TOKENS: readonly ColorTokenPreset[] = [
  { token: 'accent', label: 'Accent', value: 'oklch(58% 0.18 285)' },
  { token: 'foreground', label: 'Foreground', value: 'oklch(20% 0 0)' },
  { token: 'surface-1', label: 'Panel', value: 'oklch(98% 0 0)' },
]

const meta = {
  title: 'Controls/ColorField',
  component: ColorField,
  parameters: { layout: 'centered' },
  args: {
    label: 'Background',
    value: { kind: 'token', token: 'accent' },
    tokens: TOKENS,
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof ColorField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<ColorValue>(args.value)

    return <ColorField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

/** The checkerboard behind the swatch is the point of this one. */
export const Translucent: Story = {
  args: { value: { kind: 'color', color: 'oklch(58% 0.18 285 / 0.4)' }, alpha: true },
}

export const Mixed: Story = { args: { mixed: true } }

/** A stored token the current theme does not define: named, and drawn as nothing. */
export const UnknownToken: Story = { args: { value: { kind: 'token', token: 'brand' } } }

export const Disabled: Story = { args: { disabled: true } }
