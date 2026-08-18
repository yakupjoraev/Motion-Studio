import { MotionSchedulerProvider } from '@motion-studio/motion'
import type { Meta, StoryObj } from '@storybook/react'

import { Dock } from './dock'
import { dockDefinition } from './dock.definition'

/**
 * The scheduler is the decorator, because the swell reads the shared pointer bus. Without a provider the
 * tray is a still row of glyphs, which is the composition the block falls back to.
 */
const meta: Meta<typeof Dock> = {
  title: 'Blocks/Navigation/Dock',
  component: Dock,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MotionSchedulerProvider>
        <div className="ms-hero-glow flex min-h-svh items-end justify-center bg-surface-0 pb-10">
          <Story />
        </div>
      </MotionSchedulerProvider>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Dock>

export const Default: Story = { args: dockDefinition.defaults }

export const OnTheCurrentPage: Story = {
  args: { ...dockDefinition.defaults, activeHref: '#motion' },
}

/** A wider reach and a taller peak: the swell becomes a wave across the whole row. */
export const WideReach: Story = {
  args: { ...dockDefinition.defaults, magnification: 1.9, reach: 260 },
}

/** No swell at all, which is also what reduced motion leaves. */
export const Flat: Story = { args: { ...dockDefinition.defaults, magnification: 1 } }
