import type { Meta, StoryObj } from '@storybook/react'
import { type ReactElement, useState } from 'react'

import { SliderField } from './slider-field'

const meta = {
  title: 'Controls/SliderField',
  component: SliderField,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[240px]',
    label: 'Opacity',
    value: 60,
    unit: '%',
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof SliderField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <SliderField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Fractional: Story = {
  args: { label: 'Scale', value: 1, unit: 'x', min: 0, max: 4, step: 0.05 },
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <SliderField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }

/** Both halves feed one counter: dragging either must produce a single commit. */
export const CommitCount: Story = {
  render: (args): ReactElement => {
    const [value, setValue] = useState(args.value)
    const [commits, setCommits] = useState(0)

    return (
      <div className="flex flex-col gap-2">
        <SliderField
          {...args}
          value={value}
          onChange={setValue}
          onCommit={(next) => {
            setValue(next)
            setCommits((count) => count + 1)
          }}
        />
        <p className="text-2xs text-foreground-subtle">{commits} commits</p>
      </div>
    )
  },
}
