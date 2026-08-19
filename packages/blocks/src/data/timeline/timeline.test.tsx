import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { Timeline } from './timeline'
import { timelineDefinition } from './timeline.definition'
import { dateText, timelineSchema } from './timeline.schema'

const defaults = timelineDefinition.defaults

const render = (overrides: Partial<typeof defaults> & { children?: React.ReactNode } = {}) =>
  renderBlock(timelineDefinition, Timeline, overrides)

describe('Timeline', () => {
  it('validates its own defaults', () => {
    expect(() => timelineSchema.parse(defaults)).not.toThrow()
  })

  it('has no axe violations, vertical and horizontal', async () => {
    const vertical = render()
    await expectNoViolations(vertical.container)
    vertical.unmount()

    const horizontal = render({ orientation: 'horizontal' })
    await expectNoViolations(horizontal.container)
  })

  it('renders an ordered list with one item per step', () => {
    render()

    expect(screen.getByTestId('timeline-list').tagName).toBe('OL')
    expect(screen.getAllByRole('listitem')).toHaveLength(defaults.items.length)
  })

  it('gives every dated step a time element carrying the machine value', () => {
    const { container } = render()

    const times = [...container.querySelectorAll('time')]
    const dated = defaults.items.filter((item) => item.date !== '')

    expect(times).toHaveLength(dated.length)
    for (const [index, item] of dated.entries()) {
      expect(requireAt(times, index)).toHaveAttribute('datetime', item.date)
      expect(requireAt(times, index)).toHaveTextContent(dateText(item))
    }
  })

  it('renders no time element for a step with no date, rather than an empty one', () => {
    const { container } = render({
      items: [{ date: '', dateLabel: 'Soon', title: 'Undated', body: '', icon: '' }],
    })

    expect(container.querySelectorAll('time')).toHaveLength(0)
    expect(screen.getByText('Soon')).toBeInTheDocument()
  })

  it('hides the marker from the accessibility tree, position and glyph alike', () => {
    render({ marker: 'number' })

    for (const marker of screen.getAllByTestId('timeline-marker')) {
      expect(marker.querySelector('[aria-hidden="true"]')).not.toBeNull()
    }
    // The position is in the list structure; a spoken "1" beside "item 1 of 4" is the same fact twice.
    expect(screen.queryByText('1', { selector: 'span:not([aria-hidden])' })).toBeNull()
  })

  it('stops the rail before the last step', () => {
    const { container } = render()

    // One rail per gap between steps, so one fewer than the steps themselves.
    expect(container.querySelectorAll('[class*="bg-border"]')).toHaveLength(
      defaults.items.length - 1,
    )
  })

  it('adds no tab stop when it runs down the page', async () => {
    render()

    await userEvent.tab()

    expect(document.activeElement).toBe(document.body)
  })

  it('takes focus as a labelled region when it scrolls across', async () => {
    render({ orientation: 'horizontal' })

    const region = screen.getByRole('region', { name: defaults.regionLabel })

    expect(region).toHaveAttribute('tabindex', '0')

    await userEvent.tab()
    expect(document.activeElement).toBe(region)
  })

  it('snaps the strip rather than driving it from a carousel', () => {
    render({ orientation: 'horizontal' })

    const list = screen.getByTestId('timeline-list')

    expect(list.className).toContain('snap-x')
    expect(list.className).toContain('overflow-x-auto')
  })

  it('lets a child occupy a step in place of its own text', () => {
    render({ children: <p>A slotted block</p> })

    expect(screen.getByText('A slotted block')).toBeInTheDocument()
    expect(screen.queryByText(requireAt(defaults.items, 0).body)).toBeNull()
    // The steps after it keep their own text, because children fill positionally.
    expect(screen.getByText(requireAt(defaults.items, 1).body)).toBeInTheDocument()
  })
})

describe('dateText', () => {
  it('shows the machine value when the author wrote no label', () => {
    expect(dateText({ date: '2026-03', dateLabel: '', title: 'x', body: '', icon: '' })).toBe(
      '2026-03',
    )
  })

  it('prefers the label when there is one', () => {
    expect(dateText({ date: '2026-03', dateLabel: 'March', title: 'x', body: '', icon: '' })).toBe(
      'March',
    )
  })
})
