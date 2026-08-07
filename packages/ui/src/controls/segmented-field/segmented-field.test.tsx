import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { SegmentedField } from './segmented-field'

import type { SegmentedFieldProps } from './segmented-field.types'

const OPTIONS = [
  { value: 'row', content: 'Row', label: 'Row' },
  { value: 'column', content: 'Column', label: 'Column' },
] as const

const Fixture = (props: Partial<SegmentedFieldProps>): ReactElement => (
  <SegmentedField
    label="Direction"
    value="row"
    options={OPTIONS}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

describe('SegmentedField', () => {
  it('marks the selected segment', () => {
    render(<Fixture />)

    expect(screen.getByRole('radio', { name: 'Row' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Column' })).not.toBeChecked()
  })

  it('changes and commits together', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onCommit = vi.fn()

    render(<Fixture onChange={onChange} onCommit={onCommit} />)
    await user.click(screen.getByRole('radio', { name: 'Column' }))

    expect(onChange).toHaveBeenCalledWith('column')
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it('walks the segments with the arrow keys', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.tab()
    // Radix checks on focus behind a pointer/keyboard heuristic synthetic events do not trip, so in
    // jsdom the arrow moves focus and Space is what commits.
    await user.keyboard('{ArrowRight} ')

    expect(screen.getByRole('radio', { name: 'Column' })).toHaveFocus()
    expect(onCommit).toHaveBeenLastCalledWith('column')
  })

  it('leaves every segment unselected across a disagreeing selection', () => {
    render(<Fixture mixed />)

    for (const option of OPTIONS) {
      expect(screen.getByRole('radio', { name: option.label })).not.toBeChecked()
    }
  })

  it('is still editable while mixed', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture mixed onCommit={onCommit} />)
    await user.click(screen.getByRole('radio', { name: 'Column' }))

    expect(onCommit).toHaveBeenCalledWith('column')
  })

  it('names the group by the row label when hosted by one', () => {
    render(<Fixture labelledBy="row-label" />)

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby', 'row-label')
  })

  it('names itself when used on its own', () => {
    render(<Fixture />)

    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Direction')
  })

  it('is not operable when disabled', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await user.click(screen.getByRole('radio', { name: 'Column' }))

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('takes the row id so a label click can reach it', () => {
    render(<Fixture id="row-control" />)

    expect(screen.getByRole('radiogroup')).toHaveAttribute('id', 'row-control')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
