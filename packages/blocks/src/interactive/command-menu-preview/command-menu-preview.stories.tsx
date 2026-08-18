import type { Meta, StoryObj } from '@storybook/react'

import { CommandMenuPreview } from './command-menu-preview'
import { commandMenuPreviewDefinition } from './command-menu-preview.definition'

const meta: Meta<typeof CommandMenuPreview> = {
  title: 'Blocks/Interactive/CommandMenuPreview',
  component: CommandMenuPreview,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="ms-hero-glow flex min-h-svh items-center justify-center bg-surface-0 p-10">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof CommandMenuPreview>

export const Default: Story = { args: commandMenuPreviewDefinition.defaults }

/** Glass, over the glow the decorator paints — the composition a landing hero uses it in. */
export const Glass: Story = { args: commandMenuPreviewDefinition.previewProps }

export const WithoutGroups: Story = {
  args: {
    ...commandMenuPreviewDefinition.defaults,
    commands: [
      { label: 'New document', icon: 'file', hint: '⌘N', group: '' },
      { label: 'Duplicate node', icon: 'duplicate', hint: '⌘D', group: '' },
      { label: 'Undo', icon: 'undo', hint: '⌘Z', group: '' },
    ],
  },
}

export const WithoutShortcuts: Story = {
  args: {
    ...commandMenuPreviewDefinition.defaults,
    commands: [
      { label: 'Aurora background', icon: 'sparkles', hint: '', group: 'Effects' },
      { label: 'Mesh gradient', icon: 'gradient', hint: '', group: 'Effects' },
      { label: 'Noise overlay', icon: 'noise', hint: '', group: 'Effects' },
    ],
  },
}
