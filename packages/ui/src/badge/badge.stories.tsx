import type { Meta, StoryObj } from '@storybook/react'

import { Badge } from './badge'

import type { BadgeTone } from './badge.types'

const meta = {
  title: 'Chrome/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

const TONES: readonly BadgeTone[] = ['neutral', 'accent', 'success', 'warning', 'danger', 'info']

export const Default: Story = { args: { children: 'Beta' } }

export const EveryTone: Story = {
  args: { children: 'Beta' },
  render: () => (
    <div className="flex items-center gap-2">
      {TONES.map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
}

/** How it appears in the layers tree: a count beside a row, on the row's own surface. */
export const InARow: Story = {
  args: { children: '3' },
  render: () => (
    <div className="flex h-[26px] w-[240px] items-center gap-2 rounded-sm bg-surface-1 px-2 text-foreground text-xs">
      <span className="flex-1">Pricing table</span>
      <Badge>3</Badge>
    </div>
  ),
}
