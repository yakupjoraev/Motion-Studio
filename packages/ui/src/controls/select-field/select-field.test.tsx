import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { SelectField } from './select-field'

import type { SelectFieldProps } from './select-field.types'

const OPTIONS = [
  { value: 'flex', label: 'flex' },
  { value: 'grid', label: 'grid' },
  { value: 'block', label: 'block' },
] as const

// Radix Select reaches for pointer capture and measurement that jsdom does not implement.
beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

const Fixture = (props: Partial<SelectFieldProps>): ReactElement => (
  <SelectField
    label="Display"
    value="flex"
    options={OPTIONS}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const trigger = (): HTMLElement => screen.getByRole('combobox', { name: 'Display' })

describe('SelectField', () => {
  it('shows the selected option', () => {
    render(<Fixture />)

    expect(trigger()).toHaveTextContent('flex')
  })

  it('changes and commits together, because a choice has no intermediate state', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onCommit = vi.fn()

    render(<Fixture onChange={onChange} onCommit={onCommit} />)
    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: 'grid' }))

    expect(onChange).toHaveBeenCalledWith('grid')
    expect(onCommit).toHaveBeenCalledWith('grid')
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it('shows the Mixed placeholder rather than one node value across a disagreeing selection', () => {
    render(<Fixture mixed />)

    expect(trigger()).toHaveTextContent('Mixed')
  })

  it('is still editable while mixed, and applies to the whole selection', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture mixed onCommit={onCommit} />)
    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: 'block' }))

    expect(onCommit).toHaveBeenCalledWith('block')
  })

  it('shows the caller placeholder when nothing is selected', () => {
    render(<Fixture value="" placeholder="auto" />)

    expect(trigger()).toHaveTextContent('auto')
  })

  it('exposes the invalid state to assistive technology', () => {
    render(<Fixture invalid />)

    expect(trigger()).toHaveAttribute('aria-invalid', 'true')
  })

  it('is not reachable when disabled', async () => {
    const user = userEvent.setup()

    render(<Fixture disabled />)
    await user.tab()

    expect(trigger()).not.toHaveFocus()
  })

  it('takes the row name and description when hosted by one', () => {
    render(<Fixture labelledBy="row-label" describedBy="row-override" />)

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-labelledby', 'row-label')
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-describedby', 'row-override')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
