import type { Meta, StoryObj } from '@storybook/react'

import { Video } from './video'
import { videoDefinition } from './video.definition'

const meta = {
  title: 'Blocks/Content/Video',
  component: Video,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Video>

export default meta

type Story = StoryObj<typeof meta>

/** No footage ships with the repository, so these judge the frame and the empty state. */
export const Default: Story = { args: videoDefinition.defaults }

export const Square: Story = { args: { ...videoDefinition.defaults, aspect: 'square' } }

export const WithCaption: Story = {
  args: { ...videoDefinition.defaults, caption: 'Export, end to end, in one take' },
}
