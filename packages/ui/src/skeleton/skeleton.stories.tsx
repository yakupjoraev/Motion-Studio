import type { Meta, StoryObj } from '@storybook/react'

import { Skeleton } from './skeleton'

const meta = {
  title: 'Chrome/Skeleton',
  component: Skeleton,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Skeleton>

export default meta

type Story = StoryObj<typeof meta>

export const Thumbnail: Story = { args: { width: 120, height: 88 } }

export const TextLines: Story = {
  args: { shape: 'text' },
  render: () => (
    <div className="flex w-[200px] flex-col gap-1.5">
      <Skeleton shape="text" width="100%" />
      <Skeleton shape="text" width="70%" />
    </div>
  ),
}

export const Swatch: Story = { args: { shape: 'circle', width: 20, height: 20 } }

/** § Loading and empty states: a block card at 88 px, at the exact final size, with no layout shift. */
export const BlockCard: Story = {
  args: { width: 160, height: 88 },
  render: () => (
    <div className="flex w-[160px] flex-col gap-2">
      <Skeleton width="100%" height={88} />
      <Skeleton shape="text" width="60%" />
    </div>
  ),
}
