import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'
import { stubDragEnvironment } from '../../test/pointer'

import { FontField } from './font-field'

import type { FontFieldProps } from './font-field.types'

beforeEach(() => {
  stubDragEnvironment()
  Element.prototype.scrollIntoView = vi.fn()
})

const Fixture = (props: Partial<FontFieldProps>): ReactElement => (
  <FontField
    label="Type"
    value={{ family: 'var(--ms-font-sans)', size: 16, weight: 400, tracking: 0 }}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

describe('FontField', () => {
  it('groups the four properties the font kind names', () => {
    render(<Fixture />)

    expect(screen.getByRole('combobox', { name: 'Type family' })).toHaveTextContent('Sans')
    expect(screen.getByRole('spinbutton', { name: 'Type size' })).toHaveValue('16px')
    expect(screen.getByRole('combobox', { name: 'Type weight' })).toHaveTextContent('400')
    expect(screen.getByRole('spinbutton', { name: 'Type tracking' })).toHaveValue('0.00em')
  })

  it('scrubs the size', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('spinbutton', { name: 'Type size' }))
    await user.keyboard('{ArrowUp}')

    expect(onCommit).toHaveBeenLastCalledWith({
      family: 'var(--ms-font-sans)',
      size: 17,
      weight: 400,
      tracking: 0,
    })
  })

  it('scrubs tracking in hundredths of an em, which is the resolution that matters', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('spinbutton', { name: 'Type tracking' }))
    await user.keyboard('{ArrowDown}')

    expect(onCommit.mock.lastCall?.[0].tracking).toBe(-0.01)
  })

  it('reports the weight as a number, not as the string the select works in', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('combobox', { name: 'Type weight' }))
    await user.click(screen.getByRole('option', { name: '700' }))

    expect(onCommit.mock.lastCall?.[0].weight).toBe(700)
  })

  it('offers the families and weights the caller supplied', async () => {
    const user = userEvent.setup()

    render(
      <Fixture
        value={{ family: 'Satoshi', size: 16, weight: 900, tracking: 0 }}
        families={[{ value: 'Satoshi', label: 'Satoshi' }]}
        weights={[400, 900]}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Type family' })).toHaveTextContent('Satoshi')

    await user.click(screen.getByRole('combobox', { name: 'Type weight' }))

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      '400',
      '900',
    ])
  })

  it('takes the row id on the family select', () => {
    render(<Fixture id="row-control" />)

    expect(screen.getByRole('combobox', { name: 'Type family' })).toHaveAttribute(
      'id',
      'row-control',
    )
  })

  it('says Mixed on every part across a disagreeing selection', () => {
    render(<Fixture mixed />)

    expect(screen.getByRole('combobox', { name: 'Type family' })).toHaveTextContent('Mixed')
    expect(screen.getByRole('spinbutton', { name: 'Type size' })).toHaveAttribute(
      'aria-valuetext',
      'Mixed',
    )
  })

  it('is not operable when disabled', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await user.click(screen.getByRole('spinbutton', { name: 'Type size' }))
    await user.keyboard('{ArrowUp}')

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
