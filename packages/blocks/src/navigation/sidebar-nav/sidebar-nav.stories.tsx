import type { Meta, StoryObj } from '@storybook/react'

import { SidebarNav } from './sidebar-nav'
import { sidebarNavDefinition } from './sidebar-nav.definition'

const meta: Meta<typeof SidebarNav> = {
  title: 'Blocks/Navigation/Sidebar nav',
  component: SidebarNav,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex min-h-svh bg-surface-1">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof SidebarNav>

export const Default: Story = { args: sidebarNavDefinition.defaults }

export const OnTheCurrentPage: Story = {
  args: { ...sidebarNavDefinition.defaults, activeHref: '#registry' },
}

/** The rail. Hover or focus a glyph to see the label the link is named by. */
export const Rail: Story = {
  args: { ...sidebarNavDefinition.defaults, collapsed: true, activeHref: '#registry' },
}
