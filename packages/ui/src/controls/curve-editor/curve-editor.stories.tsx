import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { CurveEditor } from './curve-editor'

import type { CubicBezier } from './curve-editor.types'

const meta = {
  title: 'Controls/CurveEditor',
  component: CurveEditor,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[280px]',
    label: 'Easing',
    value: [0.2, 0, 0, 1],
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof CurveEditor>

export default meta

type Story = StoryObj<typeof meta>

/** Drag either point, or tab to it and use the arrow keys — each axis is its own slider. */
export const Standard: Story = {
  render: (args) => {
    const [value, setValue] = useState<CubicBezier>(args.value)

    return <CurveEditor {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Decelerate: Story = { args: { value: [0, 0, 0, 1] } }

export const Accelerate: Story = { args: { value: [0.3, 0, 1, 1] } }

/** Y outside 0–1 is a curve that overshoots, which the box is sized to show. */
export const Overshoot: Story = { args: { value: [0.34, 1.56, 0.64, 1] } }

export const Disabled: Story = { args: { disabled: true } }
