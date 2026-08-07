import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { StepperField } from './stepper-field'

import type { StepperFieldProps } from './stepper-field.types'

const Fixture = (props: Partial<StepperFieldProps>): ReactElement => (
  <StepperField
    label="Columns"
    value={3}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const value = (): HTMLElement => screen.getByRole('spinbutton', { name: 'Columns' })
const increase = (): HTMLElement => screen.getByRole('button', { name: 'Increase Columns' })
const decrease = (): HTMLElement => screen.getByRole('button', { name: 'Decrease Columns' })

describe('StepperField', () => {
  it('shows the value and announces it', () => {
    render(<Fixture />)

    expect(value()).toHaveTextContent('3')
    expect(value()).toHaveAttribute('aria-valuenow', '3')
  })

  it('announces the unit spelled out', () => {
    render(<Fixture value={200} unit="ms" />)

    expect(value()).toHaveAttribute('aria-valuetext', '200 milliseconds')
  })

  it('steps up and down with its buttons', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(increase())

    expect(onCommit).toHaveBeenLastCalledWith(4)

    await user.click(decrease())

    expect(onCommit).toHaveBeenLastCalledWith(2)
  })

  it('steps with the arrow keys', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(value())
    await user.keyboard('{ArrowUp}')

    expect(onCommit).toHaveBeenLastCalledWith(4)

    await user.keyboard('{ArrowDown}')

    expect(onCommit).toHaveBeenLastCalledWith(2)
  })

  it('changes and commits together, because a step has no intermediate state', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onCommit = vi.fn()

    render(<Fixture onChange={onChange} onCommit={onCommit} />)
    await user.click(increase())

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it('keeps its buttons out of the tab order, leaving the value the single stop', async () => {
    const user = userEvent.setup()

    render(<Fixture />)
    await user.tab()

    expect(value()).toHaveFocus()
    expect(increase()).toHaveAttribute('tabindex', '-1')
    expect(decrease()).toHaveAttribute('tabindex', '-1')
  })

  it('steps by the caller step rather than by one', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture value={16} step={8} onCommit={onCommit} />)
    await user.click(increase())

    expect(onCommit).toHaveBeenCalledWith(24)
  })

  it('holds the value inside its bounds', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture value={12} max={12} onCommit={onCommit} />)
    await user.click(value())
    await user.keyboard('{ArrowUp}')

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('disables the button that would leave the bounds', () => {
    render(<Fixture value={1} min={1} max={6} />)

    expect(decrease()).toBeDisabled()
    expect(increase()).toBeEnabled()
  })

  it('shows the decimals the step implies', () => {
    render(<Fixture value={1.5} step={0.5} />)

    expect(value()).toHaveTextContent('1.5')
  })

  it('reads as Mixed across a disagreeing selection', () => {
    render(<Fixture mixed />)

    expect(value()).toHaveTextContent('Mixed')
    expect(value()).toHaveAttribute('aria-valuetext', 'Mixed')
    expect(value()).not.toHaveAttribute('aria-valuenow')
  })

  it('is not operable when disabled', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await user.click(increase())

    expect(onCommit).not.toHaveBeenCalled()
    expect(value()).toHaveAttribute('aria-disabled', 'true')
    expect(value()).toHaveAttribute('tabindex', '-1')
  })

  it('takes the row name and description when hosted by one', () => {
    render(<Fixture labelledBy="row-label" describedBy="row-override" />)

    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-labelledby', 'row-label')
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-describedby', 'row-override')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture min={1} max={12} />)

    await expectNoViolations(container)
  })
})
