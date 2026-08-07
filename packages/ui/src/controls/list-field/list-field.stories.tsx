import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { TextField } from '../text-field/index'
import { ListField } from './list-field'

interface Plan {
  readonly name: string
  readonly price: string
}

const PLANS: readonly Plan[] = [
  { name: 'Free', price: '0' },
  { name: 'Pro', price: '19' },
  { name: 'Team', price: '49' },
]

const meta = {
  title: 'Controls/ListField',
  component: ListField<Plan>,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[280px]',
    label: 'Plans',
    value: PLANS,
    createItem: () => ({ name: 'New plan', price: '0' }),
    itemLabel: (plan: Plan) => plan.name,
    renderItem: () => null,
    onChange: () => undefined,
    onCommit: () => undefined,
  },
} satisfies Meta<typeof ListField<Plan>>

export default meta

type Story = StoryObj<typeof meta>

/** Open a row, reorder it, and watch the row stay open: collapse state travels with the item. */
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<readonly Plan[]>(args.value)

    return (
      <ListField<Plan>
        {...args}
        value={value}
        onChange={setValue}
        onCommit={setValue}
        renderItem={(plan, _index, edit) => (
          <>
            <TextField
              label="Name"
              value={plan.name}
              onChange={(name) => edit({ ...plan, name }, false)}
              onCommit={(name) => edit({ ...plan, name }, true)}
            />
            <TextField
              label="Price"
              value={plan.price}
              onChange={(price) => edit({ ...plan, price }, false)}
              onCommit={(price) => edit({ ...plan, price }, true)}
            />
          </>
        )}
      />
    )
  },
}

export const Empty: Story = { args: { value: [] } }

export const NotSortable: Story = { args: { sortable: false } }

export const AtTheCap: Story = { args: { max: 3 } }

export const Disabled: Story = { args: { disabled: true } }
