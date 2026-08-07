import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Tabs } from './tabs'

import type { TabItem } from './tabs.types'

const ITEMS: readonly TabItem[] = [
  { value: 'design', label: 'Design', content: 'design panel' },
  { value: 'layers', label: 'Layers', content: 'layers panel' },
  { value: 'assets', label: 'Assets', content: 'assets panel', disabled: true },
]

describe('Tabs', () => {
  it('renders a named tab list with one tab per item', () => {
    render(<Tabs aria-label="Panel" items={ITEMS} defaultValue="design" />)

    expect(screen.getByRole('tablist', { name: 'Panel' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('shows only the selected panel', () => {
    render(<Tabs aria-label="Panel" items={ITEMS} defaultValue="layers" />)

    expect(screen.getByRole('tabpanel')).toHaveTextContent('layers panel')
    expect(screen.queryByText('design panel')).not.toBeInTheDocument()
  })

  it('marks the selected tab as selected', () => {
    render(<Tabs aria-label="Panel" items={ITEMS} defaultValue="layers" />)

    expect(screen.getByRole('tab', { name: 'Layers' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Design' })).toHaveAttribute('aria-selected', 'false')
  })

  it('is one tab stop for the strip, with arrows navigating inside', async () => {
    // `UI_GUIDELINES.md` § Focus and keyboard: roving tabindex in tab strips.
    render(
      <>
        <Tabs aria-label="Panel" items={ITEMS} defaultValue="design" />
        <button type="button">after</button>
      </>,
    )

    await userEvent.tab()
    expect(screen.getByRole('tab', { name: 'Design' })).toHaveFocus()

    await userEvent.tab()
    // The next stop is the panel, which Radix makes focusable, and only then the button after it.
    expect(screen.getByRole('tabpanel')).toHaveFocus()

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
  })

  it('selects the next tab with the arrow keys', async () => {
    const onValueChange = vi.fn()
    render(
      <Tabs aria-label="Panel" items={ITEMS} defaultValue="design" onValueChange={onValueChange} />,
    )

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')

    expect(onValueChange).toHaveBeenCalledWith('layers')
    expect(screen.getByRole('tab', { name: 'Layers' })).toHaveAttribute('aria-selected', 'true')
  })

  it('wraps at the end, skipping the disabled tab', async () => {
    render(<Tabs aria-label="Panel" items={ITEMS} defaultValue="layers" />)

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: 'Design' })).toHaveAttribute('aria-selected', 'true')
  })

  it('selects on click', async () => {
    const onValueChange = vi.fn()
    render(
      <Tabs aria-label="Panel" items={ITEMS} defaultValue="design" onValueChange={onValueChange} />,
    )

    await userEvent.click(screen.getByRole('tab', { name: 'Layers' }))

    expect(onValueChange).toHaveBeenCalledWith('layers')
  })

  it('does not select a disabled tab', async () => {
    const onValueChange = vi.fn()
    render(
      <Tabs aria-label="Panel" items={ITEMS} defaultValue="design" onValueChange={onValueChange} />,
    )

    await userEvent.click(screen.getByRole('tab', { name: 'Assets' }))

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('stays where the caller put it when controlled', async () => {
    const onValueChange = vi.fn()
    render(<Tabs aria-label="Panel" items={ITEMS} value="design" onValueChange={onValueChange} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Layers' }))

    expect(onValueChange).toHaveBeenCalledWith('layers')
    expect(screen.getByRole('tab', { name: 'Design' })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders exactly one indicator, under the selected tab', () => {
    const { container } = render(<Tabs aria-label="Panel" items={ITEMS} defaultValue="layers" />)

    const indicators = container.querySelectorAll('span[class*="-bottom-px"]')

    expect(indicators).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'Layers' })).toContainElement(
      indicators[0] as HTMLElement,
    )
  })

  it('moves the indicator when an uncontrolled strip is clicked', async () => {
    const { container } = render(<Tabs aria-label="Panel" items={ITEMS} defaultValue="design" />)

    await userEvent.click(screen.getByRole('tab', { name: 'Layers' }))

    expect(screen.getByRole('tab', { name: 'Layers' })).toContainElement(
      container.querySelector('span[class*="-bottom-px"]') as HTMLElement,
    )
  })

  it('spends the accent on the underline, which § Character permits for an active tab', () => {
    const { container } = render(<Tabs aria-label="Panel" items={ITEMS} defaultValue="design" />)

    expect(container.querySelector('span[class*="-bottom-px"]')?.className).toContain('bg-accent')
  })

  it('takes its strip height from the density scale', () => {
    render(<Tabs aria-label="Panel" items={ITEMS} defaultValue="design" />)

    expect(screen.getByRole('tablist').className).toContain('h-[36px]')
  })

  it('gives every tab the focus-ring replacement', () => {
    render(<Tabs aria-label="Panel" items={ITEMS} defaultValue="design" />)

    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.className).toContain('outline-none')
      expect(tab.className).toContain('focus-visible:shadow-focus')
    }
  })

  it('renders no panel for an item that carries no content', () => {
    render(
      <Tabs
        aria-label="Panel"
        items={[
          { value: 'design', label: 'Design' },
          { value: 'layers', label: 'Layers' },
        ]}
        defaultValue="design"
      />,
    )

    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
  })

  it('forwards its ref to the root', () => {
    const ref = { current: null as HTMLDivElement | null }
    const { container } = render(
      <Tabs ref={ref} aria-label="Panel" items={ITEMS} defaultValue="design" />,
    )

    expect(ref.current).toBe(container.firstElementChild)
  })

  it('is axe clean', async () => {
    const { container } = render(<Tabs aria-label="Panel" items={ITEMS} defaultValue="design" />)

    await expectNoViolations(container)
  })
})
