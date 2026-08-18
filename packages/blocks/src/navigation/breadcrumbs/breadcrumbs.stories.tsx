import type { Meta, StoryObj } from '@storybook/react'

import { Breadcrumbs } from './breadcrumbs'
import { breadcrumbsDefinition } from './breadcrumbs.definition'

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Blocks/Navigation/Breadcrumbs',
  component: Breadcrumbs,
  decorators: [
    (Story) => (
      <div className="bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Breadcrumbs>

export const Default: Story = { args: breadcrumbsDefinition.defaults }

export const Slashes: Story = {
  args: { ...breadcrumbsDefinition.defaults, separator: 'slash' },
}

/** Seven levels through a four-crumb window: the first, the menu, and the last three. */
export const Collapsed: Story = {
  args: {
    ...breadcrumbsDefinition.defaults,
    items: [
      { label: 'Docs', href: '#docs' },
      { label: 'Guides', href: '#guides' },
      { label: 'Blocks', href: '#blocks' },
      { label: 'Categories', href: '#categories' },
      { label: 'Navigation', href: '#navigation' },
      { label: 'Breadcrumbs', href: '#breadcrumbs' },
      { label: 'Overflow', href: '#overflow' },
    ],
  },
}

export const WithStructuredData: Story = {
  args: { ...breadcrumbsDefinition.defaults, jsonLd: true },
}
