import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { StepperField } from './stepper-field'

const meta = {
  title: 'Controls/StepperField',
  component: StepperField,
  parameters: { layout: 'centered' },
  args: {
    label: 'Columns',
    value: 3,
    min: 1,
    max: 12,
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof StepperField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <StepperField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

/** At a bound the button that would leave it goes dead rather than silently doing nothing. */
export const AtItsBound: Story = { args: { value: 1 } }

export const Fractional: Story = { args: { label: 'Scale', value: 1.5, step: 0.5, min: 0, max: 4 } }

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
