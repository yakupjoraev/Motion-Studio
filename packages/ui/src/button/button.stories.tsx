import { SparklesIcon } from '@motion-studio/icons'
import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './button'

const meta = {
  title: 'Chrome/Button',
  component: Button,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button variant="primary">Export</Button>
      <Button variant="secondary">Duplicate</Button>
      <Button variant="ghost">Reset</Button>
      <Button variant="danger">Delete</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="icon" aria-label="Sparkles" leadingIcon={<SparklesIcon />} />
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button variant="primary" leadingIcon={<SparklesIcon />}>
        Generate
      </Button>
      <Button trailingIcon={<SparklesIcon />}>Trailing</Button>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button variant="primary" disabled>
        Export
      </Button>
      <Button variant="secondary" disabled>
        Duplicate
      </Button>
    </div>
  ),
}
