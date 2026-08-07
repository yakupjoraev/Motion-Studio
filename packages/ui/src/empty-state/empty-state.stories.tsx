import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '../button/index'
import { Kbd } from '../kbd/index'

import { EmptyState } from './empty-state'

const meta = {
  title: 'Chrome/EmptyState',
  component: EmptyState,
  parameters: { layout: 'centered' },
  args: { className: 'w-[280px]' },
} satisfies Meta<typeof EmptyState>

export default meta

type Story = StoryObj<typeof meta>

/** § Loading and empty states: the empty canvas is one sentence plus the palette shortcut. */
export const EmptyCanvas: Story = {
  args: { message: 'Drag a block to start', hint: <Kbd keys="Mod+K" /> },
}

export const NoResults: Story = {
  args: { message: 'No blocks match “xyz”', action: <Button size="sm">Clear</Button> },
}

export const MessageOnly: Story = { args: { message: 'Nothing here yet' } }
