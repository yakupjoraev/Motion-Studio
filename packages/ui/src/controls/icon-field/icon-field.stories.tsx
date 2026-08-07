import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { IconField } from './icon-field'

import type { IconValue } from './icon-field.types'

const meta = {
  title: 'Controls/IconField',
  component: IconField,
  parameters: { layout: 'centered' },
  args: {
    label: 'Icon',
    value: 'sparkles',
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof IconField>

export default meta

type Story = StoryObj<typeof meta>

/** Open it and type: the count above the grid is a live region, so it is announced as it changes. */
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<IconValue>(args.value)

    return <IconField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Empty: Story = { args: { value: '' } }

export const NarrowedToASubset: Story = {
  args: { names: ['play', 'pause', 'undo', 'redo'], value: 'play' },
}

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
