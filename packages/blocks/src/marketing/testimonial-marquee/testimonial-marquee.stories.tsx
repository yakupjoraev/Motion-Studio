import type { Meta, StoryObj } from '@storybook/react'

import { TestimonialMarquee } from './testimonial-marquee'
import { testimonialMarqueeDefinition } from './testimonial-marquee.definition'

const meta = {
  title: 'Blocks/Marketing/Testimonial marquee',
  component: TestimonialMarquee,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TestimonialMarquee>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: testimonialMarqueeDefinition.defaults }

export const OneRow: Story = { args: { ...testimonialMarqueeDefinition.defaults, rows: 1 } }

export const ThreeRows: Story = { args: { ...testimonialMarqueeDefinition.defaults, rows: 3 } }

/** The case most implementations break on: fewer cards than a row is wide. */
export const TwoItems: Story = {
  args: {
    ...testimonialMarqueeDefinition.defaults,
    rows: 1,
    items: testimonialMarqueeDefinition.defaults.items.slice(0, 2),
  },
}

export const WithoutEdgeFade: Story = {
  args: { ...testimonialMarqueeDefinition.defaults, fadeEdges: false },
}

export const NoPauseOnHover: Story = {
  args: { ...testimonialMarqueeDefinition.defaults, pauseOnHover: false },
}
