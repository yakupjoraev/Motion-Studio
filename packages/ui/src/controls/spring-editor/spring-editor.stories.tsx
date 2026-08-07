import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { SpringEditor } from './spring-editor'

import type { SpringValue } from './spring-editor.types'

const meta = {
  title: 'Controls/SpringEditor',
  component: SpringEditor,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[280px]',
    label: 'Spring',
    value: { stiffness: 400, damping: 30, mass: 1 },
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof SpringEditor>

export default meta

type Story = StoryObj<typeof meta>

/** Pull damping down and watch the overshoot appear; the settle time under it follows. */
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<SpringValue>(args.value)

    return <SpringEditor {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Bouncy: Story = { args: { value: { stiffness: 300, damping: 10, mass: 1 } } }

export const Stiff: Story = { args: { value: { stiffness: 550, damping: 40, mass: 1 } } }

/** Heavy and barely damped: the readout says it does not settle inside the window drawn. */
export const NeverSettles: Story = { args: { value: { stiffness: 20, damping: 1, mass: 5 } } }

export const Disabled: Story = { args: { disabled: true } }
