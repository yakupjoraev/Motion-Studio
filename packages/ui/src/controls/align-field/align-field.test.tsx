import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { AlignField } from './align-field'

import type { AlignFieldProps } from './align-field.types'

const Fixture = (props: Partial<AlignFieldProps>): ReactElement => (
  <AlignField
    label="Align"
    value={{ horizontal: 'center', vertical: 'center' }}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

describe('AlignField', () => {
  it('offers nine positions', () => {
    render(<Fixture />)

    expect(screen.getAllByRole('radio')).toHaveLength(9)
  })

  it('names each position by where it puts the content', () => {
    render(<Fixture />)

    for (const name of ['Top left', 'Centre', 'Bottom right', 'Middle left']) {
      expect(screen.getByRole('radio', { name })).toBeInTheDocument()
    }
  })

  it('marks the selected position', () => {
    render(<Fixture value={{ horizontal: 'end', vertical: 'start' }} />)

    expect(screen.getByRole('radio', { name: 'Top right' })).toBeChecked()
  })

  it('changes and commits together', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onCommit = vi.fn()

    render(<Fixture onChange={onChange} onCommit={onCommit} />)
    await user.click(screen.getByRole('radio', { name: 'Bottom right' }))

    expect(onChange).toHaveBeenCalledWith({ horizontal: 'end', vertical: 'end' })
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['{ArrowLeft}', { horizontal: 'start', vertical: 'center' }],
    ['{ArrowRight}', { horizontal: 'end', vertical: 'center' }],
    ['{ArrowUp}', { horizontal: 'center', vertical: 'start' }],
    ['{ArrowDown}', { horizontal: 'center', vertical: 'end' }],
  ])('walks the grid on %s', async (key, expected) => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.tab()
    await user.keyboard(key)

    expect(onCommit).toHaveBeenCalledWith(expected)
  })

  it('stops at the edge rather than wrapping to the far side', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture value={{ horizontal: 'start', vertical: 'start' }} onCommit={onCommit} />)
    await user.tab()
    await user.keyboard('{ArrowLeft}{ArrowUp}')

    expect(onCommit).toHaveBeenLastCalledWith({ horizontal: 'start', vertical: 'start' })
  })

  it('keeps one tab stop, the selected cell', async () => {
    const user = userEvent.setup()

    render(<Fixture />)
    await user.tab()

    expect(screen.getByRole('radio', { name: 'Centre' })).toHaveFocus()

    for (const name of ['Top left', 'Bottom right']) {
      expect(screen.getByRole('radio', { name })).toHaveAttribute('tabindex', '-1')
    }
  })

  it('names the group by the row label when hosted by one', () => {
    render(<Fixture labelledBy="row-label" describedBy="row-override" />)

    const group = screen.getByRole('radiogroup')

    expect(group).toHaveAttribute('aria-labelledby', 'row-label')
    expect(group).toHaveAttribute('aria-describedby', 'row-override')
  })

  it('names itself when used on its own', () => {
    render(<Fixture />)

    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Align')
  })

  it('is not operable when disabled', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await user.click(screen.getByRole('radio', { name: 'Top left' }))

    expect(onCommit).not.toHaveBeenCalled()
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
