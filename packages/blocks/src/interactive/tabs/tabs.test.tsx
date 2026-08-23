import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { Tabs } from './tabs'
import { tabsDefinition as definition } from './tabs.definition'
import { initialTab, tabIndex, tabValue } from './tabs.schema'
import { TABS_COUNT_VARIABLE, TABS_INDEX_VARIABLE } from './tabs.styles'

const labels = definition.defaults.items.map((item) => item.label)

/** Every panel is mounted; the open one is the one that says so. */
const openPanel = (): HTMLElement => {
  const open = screen
    .getAllByRole('tabpanel')
    .filter((panel) => panel.getAttribute('data-state') === 'active')

  expect(open).toHaveLength(1)

  return requireAt(open, 0)
}

const indexVariable = (): string =>
  screen.getByTestId('tabs-list-frame').style.getPropertyValue(TABS_INDEX_VARIABLE)

describe('the tab value', () => {
  it('round-trips through the index, so two tabs with one label stay two tabs', () => {
    expect(tabIndex(tabValue(3))).toBe(3)
  })

  it('falls back to the first tab for a value it cannot read', () => {
    expect(tabIndex('nonsense')).toBe(0)
  })

  it('clamps an out-of-range default, because it may outlive the tab it pointed at', () => {
    expect(initialTab(2, 4)).toBe(2)
    expect(initialTab(9, 4)).toBe(0)
    expect(initialTab(-1, 4)).toBe(0)
  })
})

describe('Tabs', () => {
  it('is a labelled tablist with one panel open', () => {
    renderBlock(definition, Tabs)

    expect(screen.getByRole('tablist', { name: definition.defaults.ariaLabel })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(labels.length)
    expect(screen.getByRole('tab', { name: requireAt(labels, 0) })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    // One panel is open, and the other three are in the document but `hidden` — `forceMount`, so the
    // exported page contains every panel's text.
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(document.querySelectorAll('[role="tabpanel"]')).toHaveLength(labels.length)
  })

  it('wires each trigger to its own panel in both directions', () => {
    renderBlock(definition, Tabs)

    const trigger = screen.getByRole('tab', { name: requireAt(labels, 0) })
    const panel = openPanel()

    expect(trigger.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.getAttribute('aria-labelledby')).toBe(trigger.id)
  })

  it('moves and activates with the arrow keys, and wraps at the end', async () => {
    renderBlock(definition, Tabs)

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: requireAt(labels, 1) })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await userEvent.keyboard('{End}')

    expect(screen.getByRole('tab', { name: requireAt(labels, labels.length - 1) })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await userEvent.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: requireAt(labels, 0) })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('leaves the strip after one tab stop and lands in the open panel', async () => {
    renderBlock(definition, Tabs)

    await userEvent.tab()
    await userEvent.tab()

    expect(openPanel()).toHaveFocus()
  })

  describe('the indicator', () => {
    it('is driven by two custom properties rather than by a measurement', () => {
      renderBlock(definition, Tabs)

      const frame = screen.getByTestId('tabs-list-frame')

      expect(frame.style.getPropertyValue(TABS_COUNT_VARIABLE)).toBe(String(labels.length))
      expect(indexVariable()).toBe('0')
    })

    it('travels whole multiples of its own width', () => {
      renderBlock(definition, Tabs)

      const indicator = screen.getByTestId('tabs-indicator')

      expect(indicator.className).toContain('w-[calc(100%/var(--ms-tabs-count))]')
      expect(indicator.className).toContain('translate-x-[calc(var(--ms-tabs-index)*100%)]')
      expect(indicator).toHaveAttribute('aria-hidden', 'true')
    })

    it('follows the selection', async () => {
      renderBlock(definition, Tabs)

      await userEvent.click(screen.getByRole('tab', { name: requireAt(labels, 2) }))

      expect(indexVariable()).toBe('2')
    })

    it('switches axis with the orientation, with the same arithmetic', () => {
      renderBlock(definition, Tabs, { orientation: 'vertical' })

      expect(screen.getByTestId('tabs-indicator').className).toContain(
        'translate-y-[calc(var(--ms-tabs-index)*100%)]',
      )
    })
  })

  /* Prompt 40's central requirement: a block that reset on every keystroke would be unusable in an editor. */
  it('keeps the open tab and the indicator when an unrelated prop changes', async () => {
    const view = renderBlock(definition, Tabs)

    await userEvent.click(screen.getByRole('tab', { name: requireAt(labels, 2) }))

    view.rerender(
      <Tabs {...definition.propsSchema.parse({ ariaLabel: 'Chapters', align: 'center' })} />,
    )

    expect(screen.getByRole('tab', { name: requireAt(labels, 2) })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(indexVariable()).toBe('2')
  })

  it('opens on the tab it is told to', () => {
    renderBlock(definition, Tabs, { defaultTab: 2 })

    expect(screen.getByRole('tab', { name: requireAt(labels, 2) })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(indexVariable()).toBe('2')
  })

  describe('the panels', () => {
    it('render their own text when no child occupies them', () => {
      renderBlock(definition, Tabs)

      expect(openPanel().textContent?.startsWith('A visual editor')).toBe(true)
    })

    it('let a child win over the text, per index', () => {
      renderBlock(definition, Tabs, {
        children: <div data-testid="dropped">dropped block</div>,
      })

      expect(screen.getByTestId('dropped')).toBeInTheDocument()
      expect(openPanel().textContent).toBe('dropped block')
    })
  })

  it('hides itself with the responsive visibility class', () => {
    renderBlock(definition, Tabs, { hidden: true })

    expect(screen.getByTestId('tabs').className).toContain('hidden')
  })

  it('has no axe violations, in either orientation', async () => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const { container } = renderBlock(definition, Tabs, { orientation })

      await expectNoViolations(container)
    }
  })
})
