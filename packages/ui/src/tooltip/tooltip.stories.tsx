import { RedoIcon, UndoIcon, ZapIcon } from '@motion-studio/icons'
import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '../button/index'

import { Tooltip, TooltipProvider } from './tooltip'

const meta = {
  title: 'Chrome/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tooltip>

export default meta

type Story = StoryObj<typeof meta>

export const Plain: Story = {
  args: {
    label: 'Undo',
    children: (
      <Button variant="ghost" size="icon">
        <UndoIcon />
      </Button>
    ),
  },
  render: (args) => (
    <TooltipProvider>
      <Tooltip {...args} />
    </TooltipProvider>
  ),
}

export const WithShortcut: Story = {
  ...Plain,
  args: { ...Plain.args, shortcut: 'Mod+Z' },
}

export const Below: Story = {
  ...Plain,
  args: { ...Plain.args, shortcut: 'Mod+Z', side: 'bottom' },
}

/**
 * A toolbar row. One provider covers the group, so the 500 ms delay is paid once and moving along the row
 * shows the rest immediately — § Interaction feel, a hint rather than an obstacle.
 */
export const AcrossAToolbar: Story = {
  args: { label: 'Undo', children: <span /> },
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip label="Undo" shortcut="Mod+Z">
          <Button variant="ghost" size="icon">
            <UndoIcon />
          </Button>
        </Tooltip>
        <Tooltip label="Redo" shortcut="Mod+Shift+Z">
          <Button variant="ghost" size="icon">
            <RedoIcon />
          </Button>
        </Tooltip>
        <Tooltip label="Run motion" shortcut="Mod+Enter">
          <Button variant="ghost" size="icon">
            <ZapIcon />
          </Button>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
}
