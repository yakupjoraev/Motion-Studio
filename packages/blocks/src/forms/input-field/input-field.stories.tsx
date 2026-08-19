import type { Meta, StoryObj } from '@storybook/react'

import { InputField } from './input-field'
import { inputFieldDefinition } from './input-field.definition'

const meta: Meta<typeof InputField> = {
  title: 'Blocks/Forms/InputField',
  component: InputField,
  decorators: [
    (Story) => (
      <div className="max-w-md bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof InputField>

const defaults = inputFieldDefinition.defaults

export const Default: Story = { args: defaults }

export const Required: Story = { args: { ...defaults, required: true } }

/** The error says what to do, not what went wrong. */
export const Invalid: Story = {
  args: { ...defaults, required: true, error: 'Enter a valid email address.' },
}

export const WithoutHint: Story = { args: { ...defaults, hint: '' } }

export const Disabled: Story = { args: { ...defaults, disabled: true } }

export const Multiline: Story = {
  args: {
    ...defaults,
    label: 'What are you building?',
    hint: 'A sentence is plenty.',
    name: 'message',
    type: 'text',
    autoComplete: '',
    placeholder: 'A landing page for a launch next month.',
    multiline: true,
  },
}

/** Two instances, which is the case `useId` exists for: the second label must not point at the first field. */
export const TwoInstances: Story = {
  args: defaults,
  render: (args) => (
    <div className="flex flex-col gap-6">
      <InputField {...args} label="Work email" name="work-email" />
      <InputField {...args} label="Personal email" name="personal-email" />
    </div>
  ),
}
