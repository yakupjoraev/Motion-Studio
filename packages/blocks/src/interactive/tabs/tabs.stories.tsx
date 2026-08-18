import type { Meta, StoryObj } from '@storybook/react'

import { Tabs } from './tabs'
import { tabsDefinition } from './tabs.definition'

const meta: Meta<typeof Tabs> = {
  title: 'Blocks/Interactive/Tabs',
  component: Tabs,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl bg-surface-0 p-8">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = { args: tabsDefinition.defaults }

export const Vertical: Story = {
  args: { ...tabsDefinition.defaults, orientation: 'vertical' },
}

/** The strip hugs its content instead of filling the width. The columns are still equal. */
export const Centred: Story = {
  args: { ...tabsDefinition.defaults, align: 'center' },
}

export const WithGlyphs: Story = {
  args: {
    ...tabsDefinition.defaults,
    items: [
      {
        label: 'Design',
        icon: 'palette',
        body: 'Tokens, themes, and the three curves behind them.',
      },
      { label: 'Motion', icon: 'zap', body: 'Presets per channel, composed rather than stacked.' },
      {
        label: 'Export',
        icon: 'export',
        body: 'React, Next, or plain HTML with Tailwind classes.',
      },
    ],
  },
}

export const OpensOnTheThird: Story = {
  args: { ...tabsDefinition.defaults, defaultTab: 2 },
}

/** A dropped block fills its panel; the panels beside it keep their own text — ADR-206. */
export const WithAChildInOnePanel: Story = {
  args: tabsDefinition.defaults,
  render: (args) => (
    <Tabs {...args}>
      <div className="rounded-lg border border-border bg-surface-1 p-6 text-foreground text-md">
        A block dropped into the first panel
      </div>
    </Tabs>
  ),
}
