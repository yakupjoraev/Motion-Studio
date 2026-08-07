import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { RichTextField } from './rich-text-field'

const meta = {
  title: 'Controls/RichTextField',
  component: RichTextField,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[280px]',
    label: 'Heading',
    value: '<strong>Ship</strong> the thing.',
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof RichTextField>

export default meta

type Story = StoryObj<typeof meta>

/** Paste formatted text from anywhere: the words arrive, the formatting does not. */
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)

    return (
      <div className="flex w-[280px] flex-col gap-2">
        <RichTextField {...args} value={value} onChange={setValue} onCommit={setValue} />
        <p className="break-all font-mono text-2xs text-foreground-subtle">{value}</p>
      </div>
    )
  },
}

export const Empty: Story = { args: { value: '', placeholder: 'Write a heading' } }

export const WithALink: Story = {
  args: { value: 'Read the <a href="https://motion.studio">docs</a>.' },
}

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
