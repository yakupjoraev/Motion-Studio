import type { Meta, StoryObj } from '@storybook/react'

import { Image } from './image'
import { imageDefinition } from './image.definition'

const meta = {
  title: 'Blocks/Content/Image',
  component: Image,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Image>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Defaults: no file. The repository ships no photograph, and a story pointing at a stock URL would be
 * judging the photograph — so what these show is the empty plate and the frame options around it.
 */
export const Default: Story = { args: imageDefinition.defaults }

export const Video: Story = { args: { ...imageDefinition.defaults, aspect: 'video' } }

export const Square: Story = { args: { ...imageDefinition.defaults, aspect: 'square' } }

export const WithCaption: Story = {
  args: {
    ...imageDefinition.defaults,
    aspect: 'video',
    caption: 'The studio, mid-edit, with the inspector open',
  },
}

export const Round: Story = {
  args: { ...imageDefinition.defaults, aspect: 'square', radius: 'full' },
}
