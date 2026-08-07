import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { TextareaField } from './textarea-field'

import type { TextareaFieldProps } from './textarea-field.types'

const Fixture = (props: Partial<TextareaFieldProps>): ReactElement => (
  <TextareaField
    label="Body"
    value="Copy"
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const field = (): HTMLElement => screen.getByRole('textbox', { name: 'Body' })

describe('TextareaField', () => {
  it('shows the value it was given', () => {
    render(<Fixture />)

    expect(field()).toHaveValue('Copy')
  })

  it('treats Enter as a newline rather than a commit', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture value="" onCommit={onCommit} />)
    await user.type(field(), 'one{Enter}two')

    expect(onCommit).not.toHaveBeenCalled()
    expect(field()).toHaveValue('one\ntwo')
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
    await user.type(field(), 'Copy')
    await user.click(screen.getByRole('button', { name: 'elsewhere' }))

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith('Copy')
  })

  it('reports each keystroke through onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<Fixture value="" onChange={onChange} />)
    await user.type(field(), 'abc')

    expect(onChange).toHaveBeenCalledTimes(3)
  })

  it('does not commit a draft that matches the value', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(
      <>
        <Fixture onCommit={onCommit} />
        <button type="button">elsewhere</button>
      </>,
    )
    await user.click(field())
    await user.click(screen.getByRole('button', { name: 'elsewhere' }))

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('starts at the row count the caller asked for', () => {
    render(<Fixture rows={4} />)

    expect(field()).toHaveAttribute('rows', '4')
  })

  it('stands empty behind a Mixed placeholder across a disagreeing selection', () => {
    render(<Fixture mixed placeholder="Body copy" />)

    expect(field()).toHaveValue('')
    expect(field()).toHaveAttribute('placeholder', 'Mixed')
  })

  it('exposes the invalid state to assistive technology', () => {
    render(<Fixture invalid />)

    expect(field()).toHaveAttribute('aria-invalid', 'true')
  })

  it('takes the row name and description when hosted by one', () => {
    render(<Fixture labelledBy="row-label" describedBy="row-override" />)

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-labelledby', 'row-label')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'row-override')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
