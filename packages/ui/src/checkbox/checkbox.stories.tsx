import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Checkbox } from './checkbox'

import type { CheckboxState } from './checkbox.types'

const meta = {
  title: 'Chrome/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  args: { 'aria-label': 'Clip content' },
} satisfies Meta<typeof Checkbox>

export default meta

type Story = StoryObj<typeof meta>

export const Off: Story = {}

export const On: Story = { args: { defaultChecked: true } }

/** `UI_GUIDELINES.md` § Multi-selection: on for some of the selected nodes, off for the rest. */
export const Mixed: Story = { args: { checked: 'indeterminate' } }

export const Disabled: Story = { args: { disabled: true } }

export const DisabledOn: Story = { args: { disabled: true, defaultChecked: true } }

/** The three states side by side, which is the only way to judge whether the marks read apart. */
export const AllStates: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Checkbox aria-label="Off" />
      <Checkbox aria-label="Mixed" checked="indeterminate" />
      <Checkbox aria-label="On" defaultChecked />
    </div>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState<CheckboxState>('indeterminate')

    return <Checkbox aria-label="Clip content" checked={checked} onCheckedChange={setChecked} />
  },
}
