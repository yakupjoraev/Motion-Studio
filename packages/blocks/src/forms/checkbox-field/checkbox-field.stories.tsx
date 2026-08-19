import type { Meta, StoryObj } from '@storybook/react'

import { CheckboxField } from './checkbox-field'
import { checkboxFieldDefinition } from './checkbox-field.definition'

const meta: Meta<typeof CheckboxField> = {
  title: 'Blocks/Forms/CheckboxField',
  component: CheckboxField,
  decorators: [
    (Story) => (
      <div className="max-w-md bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof CheckboxField>

const defaults = checkboxFieldDefinition.defaults

export const Default: Story = { args: defaults }

export const Required: Story = { args: { ...defaults, required: true } }

/** One answer rather than any of them, which is a different element and a different keyboard. */
export const Radios: Story = {
  args: {
    ...defaults,
    mode: 'radio',
    label: 'How should we reach you?',
    hint: 'Pick one.',
    name: 'contact-method',
    choices: [
      {
        value: 'email',
        label: 'Email',
        hint: 'Usually within a day.',
        checked: true,
        disabled: false,
      },
      { value: 'call', label: 'A call', hint: '', checked: false, disabled: false },
      { value: 'none', label: 'Don’t contact me', hint: '', checked: false, disabled: false },
    ],
  },
}

export const Inline: Story = {
  args: {
    ...defaults,
    layout: 'inline',
    choices: defaults.choices.map((c) => ({ ...c, hint: '' })),
  },
}

/** The error says what to do, not what went wrong. */
export const Invalid: Story = {
  args: { ...defaults, required: true, error: 'Choose at least one topic.' },
}

export const Disabled: Story = { args: { ...defaults, disabled: true } }
