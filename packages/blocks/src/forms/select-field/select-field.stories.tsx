import type { Meta, StoryObj } from '@storybook/react'

import { SelectField } from './select-field'
import { selectFieldDefinition } from './select-field.definition'

const meta: Meta<typeof SelectField> = {
  title: 'Blocks/Forms/SelectField',
  component: SelectField,
  decorators: [
    (Story) => (
      <div className="max-w-md bg-surface-0 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof SelectField>

const defaults = selectFieldDefinition.defaults

export const Default: Story = { args: defaults }

export const Required: Story = { args: { ...defaults, required: true } }

export const Chosen: Story = { args: { ...defaults, defaultValue: 'next' } }

/** The error says what to do, not what went wrong. */
export const Invalid: Story = {
  args: { ...defaults, required: true, error: 'Choose an export target.' },
}

export const Disabled: Story = { args: { ...defaults, disabled: true } }

export const WithoutHint: Story = { args: { ...defaults, hint: '' } }
