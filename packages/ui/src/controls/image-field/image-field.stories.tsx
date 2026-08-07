import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { ImageField } from './image-field'

import type { ImageValue } from './image-field.types'

/** An inline SVG, so the story needs no network and no fixture file. */
const SAMPLE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="%235b48c9"/></svg>'

const meta = {
  title: 'Controls/ImageField',
  component: ImageField,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[240px]',
    label: 'Image',
    value: { src: SAMPLE, alt: 'A violet field' },
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof ImageField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<ImageValue>(args.value)

    return <ImageField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Empty: Story = { args: { value: { src: '', alt: '' } } }

/** The warning that is the point of the control: clear the alt field to see it. */
export const MissingAltText: Story = { args: { value: { src: SAMPLE, alt: '' } } }

export const Square: Story = { args: { aspect: 1 } }

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
