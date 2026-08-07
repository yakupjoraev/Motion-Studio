import type { Meta, StoryObj } from '@storybook/react'

import { Kbd } from './kbd'

const meta = {
  title: 'Chrome/Kbd',
  component: Kbd,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Kbd>

export default meta

type Story = StoryObj<typeof meta>

export const Detected: Story = { args: { keys: 'Mod+Shift+Z' } }

export const Mac: Story = { args: { keys: 'Mod+Shift+Z', platform: 'mac' } }

export const Other: Story = { args: { keys: 'Mod+Shift+Z', platform: 'other' } }

/** Both languages side by side, which is the only way to judge whether the caps stay the same weight. */
export const BothPlatforms: Story = {
  args: { keys: 'Mod+Shift+Z' },
  render: () => (
    <div className="flex flex-col gap-2 text-xs text-foreground-muted">
      {['Mod+K', 'Mod+Shift+Z', 'Mod+Alt+V', 'Escape'].map((keys) => (
        <div key={keys} className="flex items-center gap-3">
          <span className="w-[96px]">{keys}</span>
          <Kbd keys={keys} platform="mac" />
          <Kbd keys={keys} platform="other" />
        </div>
      ))}
    </div>
  ),
}
