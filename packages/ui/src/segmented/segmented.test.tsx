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
    /*
     * Measured, not assumed: in jsdom the arrow moves focus and Space commits. Radix checks on focus in a
     * real browser — it gates that on a pointer/keyboard heuristic that synthetic events do not trip — so
     * this asserts the half that is observable here. The browser half belongs to the Storybook walkthrough,
     * which is still outstanding for this prompt.
     */
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

  it('renders exactly one indicator, and only behind the selected segment', () => {
    const { container } = render(
      <Segmented aria-label="Direction" options={OPTIONS} defaultValue="column" />,
    )

    // One moving element rather than a background per segment: two would disagree mid-animation.
    const indicators = container.querySelectorAll('span[class*="absolute"]')
    expect(indicators).toHaveLength(1)
    expect(screen.getByRole('radio', { name: 'Column' })).toContainElement(
      indicators[0] as HTMLElement,
    )
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
