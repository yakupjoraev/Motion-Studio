import type { Meta, StoryObj } from '@storybook/react'

import { ModalTrigger } from './modal-trigger'
import { modalTriggerDefinition } from './modal-trigger.definition'

const meta: Meta<typeof ModalTrigger> = {
  title: 'Blocks/Interactive/ModalTrigger',
  component: ModalTrigger,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl bg-surface-0 p-8">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ModalTrigger>

export const Default: Story = { args: modalTriggerDefinition.defaults }

/** Open, which is what the canvas and the palette thumbnail show — ADR-205. */
export const Open: Story = { args: modalTriggerDefinition.previewProps }

export const Narrow: Story = {
  args: { ...modalTriggerDefinition.previewProps, size: 'sm' },
}

export const Wide: Story = {
  args: { ...modalTriggerDefinition.previewProps, size: 'lg' },
}

export const WithAPrimaryTrigger: Story = {
  args: { ...modalTriggerDefinition.defaults, triggerVariant: 'primary', triggerSize: 'lg' },
}

/** A block in the slot replaces the placeholder text. */
export const WithAChild: Story = {
  args: modalTriggerDefinition.previewProps,
  render: (args) => (
    <ModalTrigger {...args}>
      <div className="rounded-md border border-border bg-surface-2 p-4 text-base text-foreground">
        A form dropped into the dialog
      </div>
    </ModalTrigger>
  ),
}
