import type { Meta, StoryObj } from '@storybook/react'

import { WaitlistForm } from './waitlist-form'
import { waitlistFormDefinition } from './waitlist-form.definition'

const meta: Meta<typeof WaitlistForm> = {
  title: 'Blocks/Forms/WaitlistForm',
  component: WaitlistForm,
  decorators: [
    (Story) => (
      <div className="max-w-2xl bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof WaitlistForm>

const defaults = waitlistFormDefinition.defaults

export const Default: Story = { args: defaults }

/** The label drawn rather than only announced, which is the same element either way. */
export const WithVisibleLabel: Story = {
  args: { ...defaults, showLabel: true, hint: 'We’ll only use it for the launch email.' },
}

export const Submitting: Story = {
  args: {
    ...defaults,
    onSubmit: () => new Promise<void>((resolve) => setTimeout(resolve, 4000)),
  },
}

export const HandlerFails: Story = {
  args: {
    ...defaults,
    onSubmit: () => {
      throw new Error('No backend')
    },
  },
}

export const WithoutNote: Story = { args: { ...defaults, note: '' } }
