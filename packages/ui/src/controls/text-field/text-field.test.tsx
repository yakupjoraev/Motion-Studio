import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { TextField } from './text-field'

import type { TextFieldProps } from './text-field.types'

const Fixture = (props: Partial<TextFieldProps>): ReactElement => (
  <TextField
    label="Name"
    value="Hero"
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const field = (): HTMLElement => screen.getByRole('textbox', { name: 'Name' })

describe('TextField', () => {
  it('shows the value it was given', () => {
    render(<Fixture />)

    expect(field()).toHaveValue('Hero')
  })

  it('reports every keystroke through onChange and nothing through onCommit', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onCommit = vi.fn()

    render(<Fixture value="" onChange={onChange} onCommit={onCommit} />)
    await user.type(field(), 'Hero')

    expect(onChange).toHaveBeenCalledTimes(4)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commits once on Enter', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture value="" onCommit={onCommit} />)
    await user.type(field(), 'Hero{Enter}')

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith('Hero')
  })

  it('commits on blur', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(
      <>
        <Fixture value="" onCommit={onCommit} />
        <button type="button">elsewhere</button>
      </>,
    )
    await user.type(field(), 'Hero')
    await user.click(screen.getByRole('button', { name: 'elsewhere' }))

    expect(onCommit).toHaveBeenCalledWith('Hero')
  })

  it('does not commit a draft that matches the value', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(field())
    await user.keyboard('{Enter}')

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('takes a value committed elsewhere over the draft it was holding', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Fixture value="Hero" />)

    await user.type(field(), 'x')
    rerender(<Fixture value="Footer" />)

    expect(field()).toHaveValue('Footer')
  })

  it('stands empty behind a Mixed placeholder across a disagreeing selection', () => {
    render(<Fixture mixed placeholder="Untitled" />)

    expect(field()).toHaveValue('')
    expect(field()).toHaveAttribute('placeholder', 'Mixed')
  })

  it('caps the length when the caller asks it to', async () => {
    const user = userEvent.setup()

    render(<Fixture value="" maxLength={4} />)
    await user.type(field(), 'Hero section')

    expect(field()).toHaveValue('Hero')
  })

  it('exposes the invalid state to assistive technology', () => {
    render(<Fixture invalid />)

    expect(field()).toHaveAttribute('aria-invalid', 'true')
  })

  it('is not editable when disabled', () => {
    render(<Fixture disabled />)

    expect(field()).toBeDisabled()
  })

  it('takes the row name and description when hosted by one', () => {
    render(<Fixture labelledBy="row-label" describedBy="row-override" />)

    const input = screen.getByRole('textbox')

    expect(input).toHaveAttribute('aria-labelledby', 'row-label')
    expect(input).toHaveAttribute('aria-describedby', 'row-override')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
