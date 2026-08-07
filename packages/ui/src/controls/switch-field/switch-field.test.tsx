import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { SwitchField } from './switch-field'

import type { SwitchFieldProps } from './switch-field.types'

const Fixture = (props: Partial<SwitchFieldProps>): ReactElement => (
  <SwitchField
    label="Clip content"
    value={false}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const control = (): HTMLElement => screen.getByRole('switch', { name: 'Clip content' })

describe('SwitchField', () => {
  it('reflects the value it was given', () => {
    render(<Fixture value />)

    expect(control()).toBeChecked()
  })

  it('changes and commits together', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onCommit = vi.fn()

    render(<Fixture onChange={onChange} onCommit={onCommit} />)
    await user.click(control())

    expect(onChange).toHaveBeenCalledWith(true)
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it('toggles from the keyboard', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.tab()
    await user.keyboard(' ')

    expect(onCommit).toHaveBeenCalledWith(true)
  })

  it('reads as off and says Mixed rather than lying with aria-checked', () => {
    render(<Fixture value mixed />)

    expect(control()).not.toBeChecked()
    expect(control()).toHaveAccessibleDescription('Mixed')
  })

  it('renders the hint and points the switch at it', () => {
    render(<Fixture hint="overflow: hidden" />)

    expect(control()).toHaveAccessibleDescription('overflow: hidden')
  })

  it('keeps the row description alongside its own', () => {
    render(<Fixture hint="overflow: hidden" describedBy="row-override" />)

    expect(control().getAttribute('aria-describedby')?.split(' ')).toContain('row-override')
  })

  it('is not operable when disabled', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await user.click(control())

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('takes the row name when hosted by one', () => {
    render(<Fixture labelledBy="row-label" />)

    expect(screen.getByRole('switch')).toHaveAttribute('aria-labelledby', 'row-label')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture hint="overflow: hidden" />)

    await expectNoViolations(container)
  })
})
