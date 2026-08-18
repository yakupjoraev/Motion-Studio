import { MotionSchedulerProvider } from '@motion-studio/motion'
import type { Meta, StoryObj } from '@storybook/react'

import { Navbar } from './navbar'
import { navbarDefinition } from './navbar.definition'

/**
 * The scheduler is the decorator rather than the block's own listener: `useScrolled` reads the shared
 * scroll bus, so a story without a provider shows the unscrolled bar — which is the point of ADR-191.
 */
const meta: Meta<typeof Navbar> = {
  title: 'Blocks/Navigation/Navbar',
  component: Navbar,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MotionSchedulerProvider>
        <Story />
        <div className="h-[200vh] bg-surface-0" />
      </MotionSchedulerProvider>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Navbar>

export const Default: Story = { args: navbarDefinition.defaults }

export const OnTheCurrentPage: Story = {
  args: { ...navbarDefinition.defaults, activeHref: '#pricing' },
}

export const NotSticky: Story = { args: { ...navbarDefinition.defaults, sticky: false } }

export const WithoutDropdowns: Story = {
  args: {
    ...navbarDefinition.defaults,
    links: navbarDefinition.defaults.links.map((link) => ({ ...link, children: [] })),
  },
}
