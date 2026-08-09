import type { Meta, StoryObj } from '@storybook/react'

import { Badge } from './badge'
import { badgeDefinition } from './badge.definition'

const meta = {
  title: 'Blocks/Content/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: badgeDefinition.defaults }

export const Status: Story = {
  args: { ...badgeDefinition.defaults, label: 'Live', variant: 'success', dot: true },
}

export const WithIcon: Story = {
  args: { ...badgeDefinition.defaults, label: 'Verified', icon: 'check', variant: 'info' },
}

export const Large: Story = { args: { ...badgeDefinition.defaults, size: 'lg' } }
