import { AlignCenterHIcon, AlignLeftIcon, AlignRightIcon } from '@motion-studio/icons'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Segmented } from './segmented'

const meta = {
  title: 'Chrome/Segmented',
  component: Segmented,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Segmented>

export default meta

type Story = StoryObj<typeof meta>

export const Text: Story = {
  args: {
    'aria-label': 'Direction',
    defaultValue: 'row',
    options: [
      { value: 'row', content: 'Row', label: 'Row' },
      { value: 'column', content: 'Column', label: 'Column' },
    ],
  },
}

export const Icons: Story = {
  args: {
    'aria-label': 'Align',
    defaultValue: 'left',
    options: [
      { value: 'left', content: <AlignLeftIcon />, label: 'Align left' },
      { value: 'center', content: <AlignCenterHIcon />, label: 'Align centre' },
      { value: 'right', content: <AlignRightIcon />, label: 'Align right' },
    ],
  },
}

/** The indicator's movement is the point of the component, so one story drives it. */
export const Controlled: Story = {
  args: { 'aria-label': 'Align', options: [] },
  render: () => {
    const [value, setValue] = useState('left')

    return (
      <Segmented
        aria-label="Align"
        value={value}
        onValueChange={setValue}
        options={[
          { value: 'left', content: <AlignLeftIcon />, label: 'Align left' },
          { value: 'center', content: <AlignCenterHIcon />, label: 'Align centre' },
          { value: 'right', content: <AlignRightIcon />, label: 'Align right' },
        ]}
      />
    )
  },
}

export const Disabled: Story = {
  args: {
    'aria-label': 'Direction',
    defaultValue: 'row',
    disabled: true,
    options: [
      { value: 'row', content: 'Row', label: 'Row' },
      { value: 'column', content: 'Column', label: 'Column' },
    ],
  },
}
