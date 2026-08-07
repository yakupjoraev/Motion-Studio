import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '../button/button'
import { Input } from '../input/input'

import { Dialog } from './dialog'

const meta = {
  title: 'Chrome/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Dialog>

export default meta

type Story = StoryObj<typeof meta>

export const Confirmation: Story = {
  args: {
    size: 'sm',
    title: 'Delete Hero',
    description: 'The block and its children are removed. This can be undone.',
    trigger: <Button variant="danger">Delete</Button>,
    footer: (
      <>
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Delete</Button>
      </>
    ),
  },
}

export const Form: Story = {
  args: {
    title: 'Rename document',
    description: 'The file name changes on the next save.',
    trigger: <Button>Rename</Button>,
    children: <Input aria-label="Document name" defaultValue="Untitled" />,
    footer: (
      <>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Rename</Button>
      </>
    ),
  },
}

/** The widest size, pinned to the studio's 1024 px minimum viewport — ADR-036. */
export const Wide: Story = {
  args: {
    size: 'lg',
    title: 'Export',
    description: 'Six files, React with Tailwind. Nothing is written until you download.',
    trigger: <Button>Export</Button>,
    children: (
      <ul className="flex flex-col gap-1 font-mono text-foreground-muted text-2xs">
        {['page.tsx', 'hero.tsx', 'pricing.tsx', 'globals.css', 'theme.css', 'motion.ts'].map(
          (file) => (
            <li key={file}>{file}</li>
          ),
        )}
      </ul>
    ),
    footer: <Button variant="primary">Download</Button>,
  },
}

/** A long body has to scroll inside the panel, or the footer leaves the window with it. */
export const Scrolling: Story = {
  args: {
    title: 'Shortcut reference',
    description: 'Every registered shortcut, grouped.',
    trigger: <Button>Shortcuts</Button>,
    children: (
      <ul className="flex flex-col gap-2 text-foreground-muted">
        {Array.from({ length: 40 }, (_, index) => `Row ${index + 1}`).map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
    ),
    footer: <Button>Close</Button>,
  },
}
