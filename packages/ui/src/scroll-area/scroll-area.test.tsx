import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { ScrollArea } from './scroll-area'
import { scrollAreaScrollbarStyles, scrollAreaThumbStyles } from './scroll-area.styles'

const rows = Array.from({ length: 30 }, (_, index) => `Row ${index + 1}`)

const Content = (): ReactElement => (
  <ul>
    {rows.map((row) => (
      <li key={row}>{row}</li>
    ))}
  </ul>
)

const viewportOf = (container: HTMLElement): Element | null =>
  container.querySelector('[data-radix-scroll-area-viewport]')

const scrollbarsOf = (container: HTMLElement): Element[] => [
  ...container.querySelectorAll('[data-orientation]'),
]

describe('ScrollArea', () => {
  it('renders its content inside a scrolling viewport', () => {
    const { container } = render(
      <ScrollArea>
        <Content />
      </ScrollArea>,
    )

    expect(screen.getByText('Row 1')).toBeInTheDocument()
    expect(viewportOf(container)).toContainElement(screen.getByText('Row 30'))
  })

  it('gives the viewport the focus ring, since overflow makes it a tab stop', () => {
    const { container } = render(
      <ScrollArea>
        <Content />
      </ScrollArea>,
    )

    expect(viewportOf(container)?.className).toContain('focus-visible:shadow-focus')
  })

  it('renders no bar until the content overflows', () => {
    // Radix mounts a hover bar from a measurement, and jsdom reports every box as zero. The styling is
    // asserted below as the pure functions it is.
    const { container } = render(
      <ScrollArea>
        <Content />
      </ScrollArea>,
    )

    expect(scrollbarsOf(container)).toHaveLength(0)
  })

  it('mounts both bars when the caller pins them', () => {
    const { container } = render(
      <ScrollArea scrollbars="always">
        <Content />
      </ScrollArea>,
    )

    expect(scrollbarsOf(container).map((bar) => bar.getAttribute('data-orientation'))).toEqual([
      'vertical',
      'horizontal',
    ])
  })

  it.each([
    ['vertical', ['vertical']],
    ['horizontal', ['horizontal']],
  ] as const)('mounts only the %s bar when asked for it', (orientation, expected) => {
    const { container } = render(
      <ScrollArea orientation={orientation} scrollbars="always">
        <Content />
      </ScrollArea>,
    )

    expect(scrollbarsOf(container).map((bar) => bar.getAttribute('data-orientation'))).toEqual([
      ...expected,
    ])
  })

  it('lays the bar over the content rather than taking a column from it', () => {
    // § Layout fixes the panel widths, so a panel cannot get narrower because one section overflowed.
    const { container } = render(
      <ScrollArea orientation="vertical" scrollbars="always">
        <Content />
      </ScrollArea>,
    )

    expect(container.firstElementChild?.className).toContain('overflow-hidden')
    expect(scrollbarsOf(container)[0]?.className).toContain('w-[8px]')
  })

  it('passes a class to the viewport separately from the frame', () => {
    const { container } = render(
      <ScrollArea className="h-[100px]" viewportClassName="p-2">
        <Content />
      </ScrollArea>,
    )

    expect(container.firstElementChild?.className).toContain('h-[100px]')
    expect(viewportOf(container)?.className).toContain('p-2')
  })

  it('spreads unknown props to its root', () => {
    render(
      <ScrollArea data-testid="panel">
        <Content />
      </ScrollArea>,
    )

    expect(screen.getByTestId('panel')).toBeInTheDocument()
  })

  it('forwards its ref to the root', () => {
    const ref = { current: null as HTMLDivElement | null }
    const { container } = render(
      <ScrollArea ref={ref}>
        <Content />
      </ScrollArea>,
    )

    expect(ref.current).toBe(container.firstElementChild)
  })

  it('is axe clean', async () => {
    const { container } = render(
      <ScrollArea scrollbars="always">
        <Content />
      </ScrollArea>,
    )

    await expectNoViolations(container)
  })
})

describe('the scrollbar styles', () => {
  it('hides a hover bar until it is wanted, and pins an always bar', () => {
    expect(scrollAreaScrollbarStyles({ scrollbars: 'hover' })).toContain('opacity-0')
    expect(scrollAreaScrollbarStyles({ scrollbars: 'always' })).not.toContain('opacity-0')
  })

  it('gives the two orientations the same 8px gutter on their own axis', () => {
    expect(scrollAreaScrollbarStyles({ orientation: 'vertical' })).toContain('w-[8px]')
    expect(scrollAreaScrollbarStyles({ orientation: 'horizontal' })).toContain('h-[8px]')
  })

  it('keeps the thumb neutral, because a scrollbar reports a position and carries no value', () => {
    // ADR-032 inverts the controls that hold a value. This is not one of them.
    expect(scrollAreaThumbStyles()).toContain('bg-border-strong')
    expect(scrollAreaThumbStyles()).not.toContain('accent')
  })
})
