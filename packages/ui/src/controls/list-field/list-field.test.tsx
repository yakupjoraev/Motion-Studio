import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactElement, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { ListField } from './list-field'

import type { ListFieldProps } from './list-field.types'

interface Plan {
  readonly name: string
}

const PLANS: readonly Plan[] = [{ name: 'Free' }, { name: 'Pro' }, { name: 'Team' }]

const Fixture = (props: Partial<ListFieldProps<Plan>>): ReactElement => (
  <ListField<Plan>
    label="Plans"
    value={PLANS}
    createItem={() => ({ name: 'New plan' })}
    itemLabel={(plan) => plan.name}
    renderItem={(plan, index, edit) => (
      <input
        aria-label={`${plan.name} name`}
        value={plan.name}
        onChange={(event) => edit({ name: event.target.value }, false)}
        data-index={index}
      />
    )}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

/** Controlled, because reordering is only observable when the value comes back in. */
const Live = (): ReactElement => {
  const [plans, setPlans] = useState(PLANS)

  return <Fixture value={plans} onChange={setPlans} onCommit={setPlans} />
}

const names = (): string[] =>
  screen.getAllByRole('button', { expanded: false }).map((row) => row.textContent ?? '')

describe('ListField', () => {
  it('renders one row per item', () => {
    render(<Fixture />)

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('names every per-item button by the item it acts on', () => {
    render(<Fixture />)

    expect(screen.getByRole('button', { name: 'Move Pro up' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Pro' })).toBeInTheDocument()
  })

  it('adds an item', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Add plans' }))

    expect(onCommit.mock.lastCall?.[0]).toHaveLength(4)
    expect(onCommit.mock.lastCall?.[0].at(-1)).toEqual({ name: 'New plan' })
  })

  it('stops adding at the cap', () => {
    render(<Fixture max={3} />)

    expect(screen.getByRole('button', { name: 'Add plans' })).toBeDisabled()
  })

  it('removes an item', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Delete Pro' }))

    expect(onCommit.mock.lastCall?.[0].map((plan: Plan) => plan.name)).toEqual(['Free', 'Team'])
  })

  it('reorders by button', async () => {
    const user = userEvent.setup()

    render(<Live />)
    await user.click(screen.getByRole('button', { name: 'Move Team up' }))

    expect(names()).toEqual(['Free', 'Team', 'Pro'])
  })

  it('keeps a row collapsed or open with the item it belongs to when the order changes', async () => {
    const user = userEvent.setup()

    render(<Live />)
    await user.click(screen.getByRole('button', { name: 'Team' }))

    expect(screen.getByRole('button', { name: 'Team' })).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('button', { name: 'Move Team up' }))

    expect(screen.getByRole('button', { name: 'Team' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Pro' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('offers no way past the ends of the list', () => {
    render(<Fixture />)

    expect(screen.getByRole('button', { name: 'Move Free up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Team down' })).toBeDisabled()
  })

  it('leaves the reorder affordances out when the list is not sortable', () => {
    render(<Fixture sortable={false} />)

    expect(screen.queryByRole('button', { name: 'Move Pro up' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Delete Pro' })).toBeInTheDocument()
  })

  it('collapses and expands a row', async () => {
    const user = userEvent.setup()

    render(<Fixture />)
    const header = screen.getByRole('button', { name: 'Pro' })

    expect(header).toHaveAttribute('aria-expanded', 'false')

    await user.click(header)

    expect(header).toHaveAttribute('aria-expanded', 'true')
  })

  it('hands each row an editor that writes back into its own item', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<Fixture onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Pro' }))
    await user.type(screen.getByRole('textbox', { name: 'Pro name' }), '!')

    expect(onChange.mock.lastCall?.[0][1]).toEqual({ name: 'Pro!' })
  })

  it('shows an empty state rather than an empty list', () => {
    render(<Fixture value={[]} />)

    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByText('No plans yet')).toBeInTheDocument()
  })

  it('is not operable when disabled', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Delete Pro' }))

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
