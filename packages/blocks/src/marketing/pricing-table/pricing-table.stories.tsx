import type { Meta, StoryObj } from '@storybook/react'

import { PricingTable } from './pricing-table'
import { pricingTableDefinition } from './pricing-table.definition'

const meta = {
  title: 'Blocks/Marketing/Pricing table',
  component: PricingTable,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PricingTable>

export default meta

type Story = StoryObj<typeof meta>

export const Cards: Story = { args: pricingTableDefinition.defaults }

export const Matrix: Story = { args: { ...pricingTableDefinition.defaults, layout: 'table' } }

export const Compact: Story = { args: { ...pricingTableDefinition.defaults, layout: 'compact' } }

export const NothingHighlighted: Story = {
  args: { ...pricingTableDefinition.defaults, highlightIndex: -1 },
}

export const Glass: Story = { args: { ...pricingTableDefinition.defaults, glass: true } }

/** The prices that are not numbers: no currency, no interval suffix. */
export const WordPrices: Story = {
  args: {
    ...pricingTableDefinition.defaults,
    plans: pricingTableDefinition.defaults.plans.map((plan, index) =>
      index === 2 ? { ...plan, priceMonthly: 'Custom', priceYearly: 'Custom' } : plan,
    ),
  },
}

export const WithoutToggle: Story = {
  args: { ...pricingTableDefinition.defaults, showToggle: false, interval: 'year' },
}
