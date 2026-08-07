import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'
import { stubDragEnvironment } from '../../test/pointer'

import { ShadowField } from './shadow-field'

import type { ShadowFieldProps, ShadowLayer } from './shadow-field.types'

const CONTACT: ShadowLayer = {
  x: 0,
  y: 2,
  blur: 4,
  spread: 0,
  color: 'oklch(0% 0 0 / 0.06)',
  inset: false,
}

const AMBIENT: ShadowLayer = {
  x: 0,
  y: 8,
  blur: 20,
  spread: 0,
  color: 'oklch(0% 0 0 / 0.12)',
  inset: false,
}

beforeEach(() => {
  stubDragEnvironment()
})

const Fixture = (props: Partial<ShadowFieldProps>): ReactElement => (
  <ShadowField
    label="Shadow"
    value={[CONTACT, AMBIENT]}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const order = (layers: readonly ShadowLayer[]): number[] => layers.map((layer) => layer.y)

describe('ShadowField', () => {
  it('lists the layers, which is the role § Inspector requires of a stack editor', () => {
    render(<Fixture />)

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('names the reorder buttons by the layer they move', () => {
    render(<Fixture />)

    expect(screen.getByRole('button', { name: 'Move shadow 2 up' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move shadow 1 down' })).toBeInTheDocument()
  })

  it('reorders by button', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Move shadow 2 up' }))

    expect(order(onCommit.mock.lastCall?.[0])).toEqual([8, 2])
  })

  it('is reorderable from the keyboard alone', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)

    // Tab to the first row's grip, then along to its "move down" button.
    await user.tab()
    await user.tab()
    await user.tab()
    await user.keyboard('{Enter}')

    expect(order(onCommit.mock.lastCall?.[0])).toEqual([8, 2])
  })

  it('offers no way past the ends of the stack', () => {
    render(<Fixture />)

    expect(screen.getByRole('button', { name: 'Move shadow 1 up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move shadow 2 down' })).toBeDisabled()
  })

  it('adds a layer', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Add a shadow layer' }))

    expect(onCommit.mock.lastCall?.[0]).toHaveLength(3)
  })

  it('stops adding at the cap the caller set', () => {
    render(<Fixture max={2} />)

    expect(screen.getByRole('button', { name: 'Add a shadow layer' })).toBeDisabled()
  })

  it('deletes a layer', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Delete shadow 1' }))

    expect(order(onCommit.mock.lastCall?.[0])).toEqual([8])
  })

  it('shows an empty state rather than an empty list', () => {
    render(<Fixture value={[]} />)

    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByText('No shadow')).toBeInTheDocument()
  })

  it('edits the selected layer and keeps the rest', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('spinbutton', { name: 'Shadow 1 Y' }))
    await user.keyboard('{ArrowUp}')

    expect(order(onCommit.mock.lastCall?.[0])).toEqual([3, 8])
  })

  it('follows the selection to the layer that was picked', async () => {
    const user = userEvent.setup()

    render(<Fixture />)
    await user.click(screen.getByRole('button', { name: 'Edit shadow 2' }))

    expect(screen.getByRole('spinbutton', { name: 'Shadow 2 Y' })).toHaveValue('8px')
  })

  it('toggles inset on the selected layer', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('switch', { name: 'Shadow 1 inset' }))

    expect(onCommit.mock.lastCall?.[0][0]).toMatchObject({ inset: true })
  })

  it('shows the CSS each layer prints to', () => {
    render(<Fixture />)

    expect(screen.getByText('0px 2px 4px 0px oklch(0% 0 0 / 0.06)')).toBeInTheDocument()
  })

  it('is not operable when disabled', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Move shadow 2 up' }))

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
