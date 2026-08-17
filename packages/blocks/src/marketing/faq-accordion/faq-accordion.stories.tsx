import type { Meta, StoryObj } from '@storybook/react'

import { FaqAccordion } from './faq-accordion'
import { faqAccordionDefinition } from './faq-accordion.definition'

const meta = {
  title: 'Blocks/Marketing/FAQ accordion',
  component: FaqAccordion,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FaqAccordion>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: faqAccordionDefinition.defaults }

export const AllClosed: Story = { args: { ...faqAccordionDefinition.defaults, defaultOpen: -1 } }

export const ManyOpenAtOnce: Story = {
  args: { ...faqAccordionDefinition.defaults, mode: 'multiple' },
}

export const WithStructuredData: Story = {
  args: { ...faqAccordionDefinition.defaults, jsonLd: true },
}
