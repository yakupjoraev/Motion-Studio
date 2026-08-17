import type { Meta, StoryObj } from '@storybook/react'

import { TestimonialCard } from './testimonial-card'
import { testimonialCardDefinition } from './testimonial-card.definition'

const meta = {
  title: 'Blocks/Marketing/Testimonial card',
  component: TestimonialCard,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TestimonialCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: testimonialCardDefinition.defaults }

export const WithEyebrow: Story = {
  args: { ...testimonialCardDefinition.defaults, eyebrow: 'Case study' },
}

export const Plain: Story = { args: { ...testimonialCardDefinition.defaults, treatment: 'plain' } }

export const Glass: Story = { args: { ...testimonialCardDefinition.defaults, treatment: 'glass' } }

/** Role without a company, which is the case the attribution joins by itself. */
export const RoleOnly: Story = {
  args: { ...testimonialCardDefinition.defaults, company: '' },
}

/** Narrow: the container query is what makes the quote step down, not the window. */
export const InANarrowColumn: Story = {
  args: testimonialCardDefinition.defaults,
  render: (args) => (
    <div className="w-[320px]">
      <TestimonialCard {...args} />
    </div>
  ),
}
