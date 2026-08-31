import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Segmented } from './segmented'

import type { SegmentedOption } from './segmented.types'

const OPTIONS: readonly SegmentedOption[] = [
  { value: 'row', content: '→', label: 'Row' },
  { value: 'column', content: '↓', label: 'Column' },
  { value: 'wrap', content: '⤶', label: 'Wrap', disabled: true },
]

describe('Segmented', () => {
  it('is a radiogroup, which is what the accessibility document requires', () => {
    render(<Segmented aria-label="Direction" options={OPTIONS} defaultValue="row" />)

    expect(screen.getByRole('radiogroup', { name: 'Direction' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('takes each segment name from its label, because an icon is not a name', () => {
    render(<Segmented aria-label="Direction" options={OPTIONS} defaultValue="row" />)

    expect(screen.getByRole('radio', { name: 'Row' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Column' })).toBeInTheDocument()
  })

  it('reports the selected segment as checked', () => {
    render(<Segmented aria-label="Direction" options={OPTIONS} defaultValue="column" />)

    expect(screen.getByRole('radio', { name: 'Column' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Row' })).not.toBeChecked()
  })

  it('moves focus along the group with arrow keys', async () => {
    render(<Segmented aria-label="Direction" options={OPTIONS} defaultValue="row" />)

    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Row' })).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')

    expect(screen.getByRole('radio', { name: 'Column' })).toHaveFocus()
  })

  it('commits the focused segment on Space', async () => {
    // In jsdom the arrow moves focus and Space commits. Radix checks on focus in a real browser, gated on a
    // pointer/keyboard heuristic that synthetic events do not trip, so only this half is observable here.
    const onValueChange = vi.fn()
    render(
      <Segmented
        aria-label="Direction"
        options={OPTIONS}
        defaultValue="row"
        onValueChange={onValueChange}
      />,
    )

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    await userEvent.keyboard(' ')

    expect(onValueChange).toHaveBeenCalledWith('column')
    expect(screen.getByRole('radio', { name: 'Column' })).toBeChecked()
  })

  it('skips a disabled segment when moving focus', async () => {
    render(<Segmented aria-label="Direction" options={OPTIONS} defaultValue="row" />)

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')

    // Three segments with the last disabled: two presses wrap back to the first rather than landing on it.
    expect(screen.getByRole('radio', { name: 'Wrap' })).not.toHaveFocus()
  })

  it('is one tab stop, not one per segment', async () => {
    render(
      <>
        <Segmented aria-label="Direction" options={OPTIONS} defaultValue="row" />
        <button type="button">after</button>
      </>,
    )

    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Row' })).toHaveFocus()

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
  })

  it('selects on click', async () => {
    const onValueChange = vi.fn()
    render(
      <Segmented
        aria-label="Direction"
        options={OPTIONS}
        defaultValue="row"
        onValueChange={onValueChange}
      />,
    )

    await userEvent.click(screen.getByRole('radio', { name: 'Column' }))

    expect(onValueChange).toHaveBeenCalledWith('column')
  })

  it('does not select a disabled segment', async () => {
    const onValueChange = vi.fn()
    render(
      <Segmented
        aria-label="Direction"
        options={OPTIONS}
        defaultValue="row"
        onValueChange={onValueChange}
      />,
    )

    await userEvent.click(screen.getByRole('radio', { name: 'Wrap' }))

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('disables every segment when the group is disabled', () => {
    render(<Segmented aria-label="Direction" options={OPTIONS} defaultValue="row" disabled />)

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
  })

  it('renders one indicator, in the group rather than in a segment', () => {
    const { container } = render(
      <Segmented aria-label="Direction" options={OPTIONS} defaultValue="column" />,
    )

    // One moving element rather than a background per segment: two would disagree mid-animation.
    // It belongs to the group, which is what lets it slide between segments without a layout
    // animation library — ADR-313.
    const indicators = screen.getAllByTestId('segmented-indicator')

    expect(indicators).toHaveLength(1)
    expect(container.firstElementChild).toContainElement(indicators[0] as HTMLElement)
    expect(screen.getByRole('radio', { name: 'Column' })).not.toContainElement(
      indicators[0] as HTMLElement,
    )
  })

  it('places the indicator from the checked segment own offsets', () => {
    const { container } = render(
      <Segmented aria-label="Direction" options={OPTIONS} defaultValue="column" />,
    )

    const root = container.firstElementChild as HTMLElement

    // jsdom has no layout, so the numbers are zero; what this asserts is that the group measured a
    // checked item and wrote both properties, which is what the CSS reads.
    expect(root.getAttribute('data-indicator')).toBe('on')
    expect(root.style.getPropertyValue('--ms-segmented-x')).toBe('0px')
    expect(root.style.getPropertyValue('--ms-segmented-w')).toBe('0px')
  })

  it('follows an uncontrolled selection', async () => {
    // Radix keeps the uncontrolled selection in its own context; without a copy the indicator never
    // moves, so this asserts the component's own copy rather than the pixels jsdom cannot give.
    render(<Segmented aria-label="Direction" options={OPTIONS} defaultValue="row" />)

    await userEvent.click(screen.getByRole('radio', { name: 'Column' }))

    expect(screen.getByRole('radio', { name: 'Column' })).toHaveAttribute('data-state', 'checked')
    expect(screen.getByRole('radio', { name: 'Row' })).toHaveAttribute('data-state', 'unchecked')
  })

  it('takes its height from the density scale', () => {
    const { container } = render(
      <Segmented aria-label="Direction" options={OPTIONS} defaultValue="row" />,
    )

    expect(container.firstElementChild?.className).toContain('h-[28px]')
  })

  it('gives every segment the focus-ring replacement', () => {
    render(<Segmented aria-label="Direction" options={OPTIONS} defaultValue="row" />)

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.className).toContain('outline-none')
      expect(radio.className).toContain('focus-visible:shadow-focus')
    }
  })

  it('forwards its ref to the group root', () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<Segmented ref={ref} aria-label="Direction" options={OPTIONS} defaultValue="row" />)

    expect(ref.current).toBe(screen.getByRole('radiogroup'))
  })

  it('is axe clean', async () => {
    const { container } = render(
      <Segmented aria-label="Direction" options={OPTIONS} defaultValue="row" />,
    )

    await expectNoViolations(container)
  })
})
