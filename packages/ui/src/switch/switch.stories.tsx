import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Switch } from './switch'

const meta = {
  title: 'Chrome/Switch',
  component: Switch,
  parameters: { layout: 'centered' },
  args: { 'aria-label': 'Snap to grid' },
} satisfies Meta<typeof Switch>

export default meta

type Story = StoryObj<typeof meta>

export const Off: Story = {}

export const On: Story = { args: { defaultChecked: true } }

export const Disabled: Story = { args: { disabled: true } }

export const DisabledOn: Story = { args: { disabled: true, defaultChecked: true } }

/** The travel is the component, so one story drives it. */
export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)

    return <Switch aria-label="Snap to grid" checked={checked} onCheckedChange={setChecked} />
  },
}

/** How it actually appears: right-aligned in a 28 px control row against an 88 px label column. */
export const InAControlRow: Story = {
  render: () => (
    <div className="flex h-[28px] w-[240px] items-center gap-2 px-2">
      <span className="w-[88px] text-xs text-foreground-muted">Snap to grid</span>
      <Switch aria-label="Snap to grid" defaultChecked />
    </div>
  ),
}
