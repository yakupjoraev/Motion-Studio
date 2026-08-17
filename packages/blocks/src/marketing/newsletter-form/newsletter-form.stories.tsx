import type { Meta, StoryObj } from '@storybook/react'

import { NewsletterForm } from './newsletter-form'
import { newsletterFormDefinition } from './newsletter-form.definition'

const meta = {
  title: 'Blocks/Marketing/Newsletter form',
  component: NewsletterForm,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof NewsletterForm>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: newsletterFormDefinition.defaults }

/** The state a reader spends the longest in: a handler that never settles. */
export const Submitting: Story = {
  args: {
    ...newsletterFormDefinition.defaults,
    onSubmit: () => new Promise<void>(() => undefined),
  },
}

export const Failing: Story = {
  args: {
    ...newsletterFormDefinition.defaults,
    onSubmit: () => Promise.reject(new Error('offline')),
  },
}

export const LabelHidden: Story = {
  args: { ...newsletterFormDefinition.defaults, showLabel: false },
}

export const WithoutSmallPrint: Story = {
  args: { ...newsletterFormDefinition.defaults, note: '' },
}
