import type { Meta, StoryObj } from '@storybook/react'

import { ThemeToggle } from './theme-toggle'
import { themeToggleDefinition } from './theme-toggle.definition'

/**
 * Clicking a choice here changes the mode of the whole Storybook page, because the block writes the same root
 * attribute the export writes. That is the block behaving identically in both places — ADR-200.
 */
const meta: Meta<typeof ThemeToggle> = {
  title: 'Blocks/Interactive/ThemeToggle',
  component: ThemeToggle,
  decorators: [
    (Story) => (
      <div className="bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ThemeToggle>

export const Default: Story = { args: themeToggleDefinition.defaults }

/** Glyphs only; each keeps its word as its accessible name. */
export const Icons: Story = {
  args: { ...themeToggleDefinition.defaults, variant: 'icons' },
}

export const WithoutSystem: Story = {
  args: { ...themeToggleDefinition.defaults, includeSystem: false },
}

export const Sizes: Story = {
  args: themeToggleDefinition.defaults,
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      <ThemeToggle {...args} size="sm" />
      <ThemeToggle {...args} size="md" />
      <ThemeToggle {...args} size="lg" />
    </div>
  ),
}

export const Translated: Story = {
  args: {
    ...themeToggleDefinition.defaults,
    lightLabel: 'Hell',
    darkLabel: 'Dunkel',
    systemLabel: 'System',
    ariaLabel: 'Farbmodus',
  },
}
