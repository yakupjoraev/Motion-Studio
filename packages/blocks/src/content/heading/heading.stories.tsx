import type { Meta, StoryObj } from '@storybook/react'

import { Heading } from './heading'
import { headingDefinition } from './heading.definition'
import { HEADING_SIZES } from './heading.schema'

const meta = {
  title: 'Blocks/Content/Heading',
  component: Heading,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Heading>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: headingDefinition.defaults }

export const Preview: Story = { args: headingDefinition.previewProps }

/** The type scale, at one level: the outline and the size are separate props. */
export const EverySize: Story = {
  args: headingDefinition.defaults,
  render: () => (
    <div className="flex flex-col gap-4">
      {HEADING_SIZES.map((size) => (
        <Heading {...headingDefinition.defaults} key={size} size={size} text={`Heading ${size}`} />
      ))}
    </div>
  ),
}

export const Gradient: Story = {
  args: { ...headingDefinition.previewProps, gradient: true },
}
