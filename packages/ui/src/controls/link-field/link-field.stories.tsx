import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { LinkField } from './link-field'

import type { LinkValue } from './link-field.types'

const meta = {
  title: 'Controls/LinkField',
  component: LinkField,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[280px]',
    label: 'Link',
    value: { href: 'https://motion.studio', target: '_self', rel: [] },
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof LinkField>

export default meta

type Story = StoryObj<typeof meta>

/** Type `javascript:` into the URL to watch the reason appear rather than only a red border. */
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<LinkValue>(args.value)

    return <LinkField {...args} value={value} onChange={setValue} onCommit={setValue} />
  },
}

export const NeedsAScheme: Story = {
  args: { value: { href: 'motion.studio', target: '_self', rel: [] } },
}

/** The warning that exists because the browser default is not the same on every browser. */
export const NewTabWithoutNoopener: Story = {
  args: { value: { href: 'https://motion.studio', target: '_blank', rel: [] } },
}

export const Mixed: Story = { args: { mixed: true } }

export const Disabled: Story = { args: { disabled: true } }
