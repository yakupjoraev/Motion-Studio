import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './button'
import { buttonDefinition } from './button.definition'

const meta: Meta<typeof Button> = {
  title: 'Blocks/Interactive/Button',
  component: Button,
  decorators: [
    (Story) => (
      <div className="flex items-center gap-3 bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = { args: buttonDefinition.defaults }

export const Secondary: Story = {
  args: { ...buttonDefinition.defaults, variant: 'secondary', label: 'Read the docs' },
}

export const Ghost: Story = {
  args: { ...buttonDefinition.defaults, variant: 'ghost', label: 'Learn more' },
}

export const Danger: Story = {
  args: { ...buttonDefinition.defaults, variant: 'danger', label: 'Delete project' },
}

/** A link rather than a button, which is what an href means here. */
export const AsLink: Story = {
  args: { ...buttonDefinition.defaults, href: '#pricing', trailingIcon: 'chevron-right' },
}

export const Sizes: Story = {
  args: buttonDefinition.defaults,
  render: (args) => (
    <>
      <Button {...args} label="Small" size="sm" />
      <Button {...args} label="Medium" size="md" />
      <Button {...args} label="Large" size="lg" />
    </>
  ),
}

/** Busy: the spinner replaces the leading glyph, and the label gains a hidden word beside it. */
export const Loading: Story = {
  args: { ...buttonDefinition.defaults, loading: true, label: 'Saving' },
}

export const FullWidth: Story = {
  args: { ...buttonDefinition.defaults, fullWidth: true, label: 'Start the trial' },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}
