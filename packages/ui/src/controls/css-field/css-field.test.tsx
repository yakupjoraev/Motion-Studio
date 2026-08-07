import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { CssField } from './css-field'

import type { CssFieldProps } from './css-field.types'

const Fixture = (props: Partial<CssFieldProps>): ReactElement => (
  <CssField
    label="Custom CSS"
    value="letter-spacing: -0.01em;"
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const field = (): HTMLElement => screen.getByRole('textbox', { name: 'Custom CSS' })

describe('CssField', () => {
  it('shows the CSS it was given', () => {
    render(<Fixture />)

    expect(field()).toHaveValue('letter-spacing: -0.01em;')
    expect(field()).not.toHaveAttribute('aria-invalid')
  })

  it('reports a problem as it is typed, with the reason and not only a border', async () => {
    const user = userEvent.setup()

    render(<Fixture value="" />)
    await user.type(field(), 'opacity 0.5')

    expect(screen.getByText('Line 1: Expected `property: value`.')).toBeInTheDocument()
    expect(field()).toHaveAttribute('aria-invalid', 'true')
  })

  it('announces the problem through the field description', async () => {
    const user = userEvent.setup()

    render(<Fixture value="" />)
    await user.type(field(), 'oops')

    expect(field()).toHaveAccessibleDescription(/Expected/)
  })

  it('commits a valid draft on blur', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(
      <>
        <Fixture value="" onCommit={onCommit} />
        <button type="button">elsewhere</button>
      </>,
    )
    await user.type(field(), 'opacity: 0.5')
    await user.click(screen.getByRole('button', { name: 'elsewhere' }))

    expect(onCommit).toHaveBeenCalledWith('opacity: 0.5')
  })

  it('does not commit a draft that did not parse', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(
      <>
        <Fixture value="" onCommit={onCommit} />
        <button type="button">elsewhere</button>
      </>,
    )
    await user.type(field(), 'opacity 0.5')
    await user.click(screen.getByRole('button', { name: 'elsewhere' }))

    expect(onCommit).not.toHaveBeenCalled()
    expect(field()).toHaveValue('opacity 0.5')
  })

  it('reports each keystroke through onChange, so a live preview can follow', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<Fixture value="" onChange={onChange} />)
    await user.type(field(), 'abc')

    expect(onChange).toHaveBeenCalledTimes(3)
  })

  it('holds the caller to the properties it allowed', () => {
    render(<Fixture properties={['opacity']} />)

    expect(screen.getByText('Line 1: letter-spacing is not editable here.')).toBeInTheDocument()
  })

  it('lists every bad line', async () => {
    const user = userEvent.setup()

    render(<Fixture value="" />)
    await user.type(field(), 'oops{Enter}also oops')

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('validates nothing across a disagreeing selection', () => {
    render(<Fixture mixed value="oops" />)

    expect(field()).toHaveValue('')
    expect(field()).toHaveAttribute('placeholder', 'Mixed')
    expect(screen.queryByRole('listitem')).toBeNull()
  })

  it('is not editable when disabled', () => {
    render(<Fixture disabled />)

    expect(field()).toBeDisabled()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture properties={['opacity']} />)

    await expectNoViolations(container)
  })
})
