import type { Meta, StoryObj } from '@storybook/react'
import type { ReactElement } from 'react'

import { Button } from '../button/index'

import { ToastProvider, useToast } from './toast'

import type { ToastOptions } from './toast.types'

const meta = {
  title: 'Chrome/Toast',
  component: ToastProvider,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ToastProvider>

export default meta

type Story = StoryObj<typeof meta>

const Publisher = ({ label, options }: { label: string; options: ToastOptions }): ReactElement => {
  const toast = useToast()

  return <Button onClick={() => toast(options)}>{label}</Button>
}

const withProvider = (children: ReactElement): ReactElement => (
  <ToastProvider>{children}</ToastProvider>
)

export const WithUndo: Story = {
  args: { children: null },
  render: () =>
    withProvider(
      <Publisher
        label="Delete Hero"
        options={{ title: 'Deleted Hero', action: { label: 'Undo', onClick: () => undefined } }}
      />,
    ),
}

export const Failure: Story = {
  args: { children: null },
  render: () =>
    withProvider(
      <Publisher
        label="Export"
        options={{
          title: 'Export failed',
          description: 'Two nodes could not be resolved.',
          tone: 'danger',
        }}
      />,
    ),
}

export const Stacked: Story = {
  args: { children: null },
  render: () =>
    withProvider(
      <Publisher
        label="Delete"
        options={{ title: 'Deleted Hero', action: { label: 'Undo', onClick: () => undefined } }}
      />,
    ),
}
