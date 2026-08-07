import type { Meta, StoryObj } from '@storybook/react'
import { type ReactElement, useState } from 'react'

import { ScrubField } from './scrub-field'

const meta = {
  title: 'Controls/ScrubField',
  component: ScrubField,
  parameters: { layout: 'centered' },
  args: {
    label: 'Radius',
    value: 16,
    unit: 'px',
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof ScrubField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <ScrubField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Bounded: Story = {
  args: { label: 'Opacity', value: 60, unit: '%', min: 0, max: 100 },
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <ScrubField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Fractional: Story = {
  args: { label: 'Scale', value: 1, unit: 'x', step: 0.05, min: 0 },
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return <ScrubField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }

/**
 * The drag-feel check prompt 09 § Verify asks for: drag the field and read the counters. One commit
 * per drag however far it travelled, and the frame count is what the value moved through.
 */
export const CommitCount: Story = {
  render: (args): ReactElement => {
    const [value, setValue] = useState(args.value)
    const [changes, setChanges] = useState(0)
    const [commits, setCommits] = useState(0)

    return (
      <div className="flex flex-col gap-2">
        <ScrubField
          {...args}
          value={value}
          onChange={(next) => {
            setValue(next)
            setChanges((count) => count + 1)
          }}
          onCommit={(next) => {
            setValue(next)
            setCommits((count) => count + 1)
          }}
        />
        <p className="text-2xs text-foreground-subtle">
          {changes} changes · {commits} commits
        </p>
      </div>
    )
  },
}
