import type { Meta, StoryObj } from '@storybook/react'

import { NewsletterForm } from '../../marketing/newsletter-form/newsletter-form'
import { newsletterFormDefinition } from '../../marketing/newsletter-form/newsletter-form.definition'

import { Footer } from './footer'
import { footerDefinition } from './footer.definition'

const meta = {
  title: 'Blocks/Navigation/Footer',
  component: Footer,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Footer>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: footerDefinition.defaults }

/** The slot filled with the block it accepts, which is how a document would fill it. */
export const WithSignup: Story = {
  args: {
    ...footerDefinition.defaults,
    newsletter: <NewsletterForm {...newsletterFormDefinition.defaults} description="" heading="" />,
  },
}

export const WithoutSocials: Story = { args: { ...footerDefinition.defaults, socials: [] } }
