import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Collapsible } from './collapsible'

const meta = {
  title: 'Chrome/Collapsible',
  component: Collapsible,
  parameters: { layout: 'centered' },
  args: { className: 'w-[280px] rounded-sm border border-border bg-surface-1' },
} satisfies Meta<typeof Collapsible>

export default meta

type Story = StoryObj<typeof meta>

const Rows = (
  <div className="flex flex-col gap-1 p-2 text-foreground-muted text-xs">
    <span>Display</span>
    <span>Direction</span>
    <span>Gap</span>
  </div>
)

export const Closed: Story = { args: { trigger: 'Layout', children: Rows } }

export const Open: Story = { args: { trigger: 'Layout', children: Rows, defaultOpen: true } }

export const Disabled: Story = { args: { trigger: 'Layout', children: Rows, disabled: true } }

/** Several sections stacked, which is how the inspector actually uses it — § Panels. */
export const APanelOfSections: Story = {
  args: { trigger: 'Layout', children: Rows },
  render: () => {
    const [open, setOpen] = useState('Layout')

    return (
      <div className="w-[280px] overflow-hidden rounded-sm border border-border bg-surface-1">
        {['Layout', 'Typography', 'Effects'].map((section) => (
          <Collapsible
            key={section}
            trigger={section}
            open={open === section}
            onOpenChange={(next) => setOpen(next ? section : '')}
          >
            {Rows}
          </Collapsible>
        ))}
      </div>
    )
  },
}
