import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { ColorPicker } from './color-picker'

import type { ColorTokenPreset, ColorValue } from './color-picker.types'

const TOKENS: readonly ColorTokenPreset[] = [
  { token: 'accent', label: 'Accent', value: 'oklch(58% 0.18 285)' },
  { token: 'foreground', label: 'Foreground', value: 'oklch(20% 0 0)' },
  { token: 'surface-1', label: 'Panel', value: 'oklch(98% 0 0)' },
  { token: 'success', label: 'Success', value: 'oklch(62% 0.15 150)' },
  { token: 'warning', label: 'Warning', value: 'oklch(72% 0.16 75)' },
  { token: 'danger', label: 'Danger', value: 'oklch(58% 0.2 25)' },
]

const meta = {
  title: 'Controls/ColorPicker',
  component: ColorPicker,
  parameters: { layout: 'centered' },
  args: {
    label: 'Background',
    value: { kind: 'color', color: 'oklch(58% 0.18 285)' },
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof ColorPicker>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<ColorValue>(args.value)

    return <ColorPicker {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

/** Picking a token stores the reference. Switch the theme and the swatch follows it. */
export const WithTokens: Story = {
  args: { tokens: TOKENS, alpha: true },
  render: (args) => {
    const [value, setValue] = useState<ColorValue>(args.value)

    return <ColorPicker {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

/** The readout is against the panel behind it. Drag into the light end to watch it fail. */
export const WithContrast: Story = {
  args: { background: 'oklch(98% 0 0)', tokens: TOKENS },
  render: (args) => {
    const [value, setValue] = useState<ColorValue>(args.value)

    return <ColorPicker {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const WithRecent: Story = {
  args: {
    tokens: TOKENS,
    recent: [
      'oklch(58% 0.18 285)',
      'oklch(62% 0.15 150)',
      'oklch(72% 0.16 75)',
      'oklch(58% 0.2 25)',
    ],
  },
}

export const Disabled: Story = { args: { disabled: true, tokens: TOKENS } }
