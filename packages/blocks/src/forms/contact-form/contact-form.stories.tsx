import type { Meta, StoryObj } from '@storybook/react'

import { ContactForm } from './contact-form'
import { contactFormDefinition } from './contact-form.definition'

const meta: Meta<typeof ContactForm> = {
  title: 'Blocks/Forms/ContactForm',
  component: ContactForm,
  decorators: [
    (Story) => (
      <div className="max-w-2xl bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ContactForm>

const defaults = contactFormDefinition.defaults

export const Default: Story = { args: defaults }

/** A handler that takes a moment, so the submitting state is visible. */
export const Submitting: Story = {
  args: {
    ...defaults,
    onSubmit: () => new Promise<void>((resolve) => setTimeout(resolve, 4000)),
  },
}

/** A handler that fails: the form stays, and the message is the form's rather than a field's. */
export const HandlerFails: Story = {
  args: {
    ...defaults,
    onSubmit: () => {
      throw new Error('No backend')
    },
  },
}

export const WithoutCopy: Story = {
  args: { ...defaults, heading: '', description: '' },
}

export const WithNote: Story = {
  args: { ...defaults, note: 'We reply from a real address. No newsletter.' },
}
