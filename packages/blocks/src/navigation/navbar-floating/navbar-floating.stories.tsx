import { MotionSchedulerProvider } from '@motion-studio/motion'
import type { Meta, StoryObj } from '@storybook/react'

import { NavbarFloating } from './navbar-floating'
import { navbarFloatingDefinition } from './navbar-floating.definition'

/**
 * The pill is drawn over a band with a gradient in it, because `requiresBackdrop` is not a decoration:
 * over a flat surface there is nothing to blur and the block cannot be judged.
 */
const meta: Meta<typeof NavbarFloating> = {
  title: 'Blocks/Navigation/Floating navbar',
  component: NavbarFloating,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MotionSchedulerProvider>
        <div className="ms-hero-glow min-h-[200vh] bg-surface-0 pt-4">
          <Story />
        </div>
      </MotionSchedulerProvider>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof NavbarFloating>

export const Default: Story = { args: navbarFloatingDefinition.defaults }

export const OnTheCurrentPage: Story = {
  args: { ...navbarFloatingDefinition.defaults, activeHref: '#pricing' },
}

/** What the block looks like when the reader has scrolled past the threshold. */
export const Scrolled: Story = {
  args: navbarFloatingDefinition.defaults,
  play: ({ canvasElement }) => {
    const bar = canvasElement.querySelector('[data-testid="navbar-floating"]')

    if (bar instanceof HTMLElement) {
      bar.setAttribute('data-scrolled', 'true')
    }
  },
}
