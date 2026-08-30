import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'
import type { StudioShortcutContext } from '../shortcuts/shortcut.types'

import { CommandPalette } from './command-palette'

const context: StudioShortcutContext = {
  store: useStudioStore,
  canvas: null,
  panels: null,
  notify: null,
}

/** The virtualizer measures the scroll element, and jsdom reports every box as zero. */
const sizeTheList = (): void => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: 320,
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 600 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 320 })
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2000 })

  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 600,
    bottom: 320,
    width: 600,
    height: 320,
    toJSON: () => ({}),
  })
}

/** The host mounts the palette only while it is open, so the test does the same. */
const open = () => {
  useStudioStore.getState().setCommandPaletteOpen(true)

  return render(<CommandPalette context={context} />)
}

describe('CommandPalette', () => {
  beforeEach(() => {
    sizeTheList()
    useStudioStore.getState().setCommandPaletteOpen(false)
  })

  it('takes focus on open, so the first keystroke reaches the search field', () => {
    open()

    expect(screen.getByRole('combobox', { name: 'Search commands' })).toHaveFocus()
  })

  it('is a combobox over a listbox, as the pattern requires', () => {
    open()

    const input = screen.getByRole('combobox', { name: 'Search commands' })

    expect(input).toHaveAttribute('aria-controls', 'palette-listbox')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox', { name: 'Commands' })).toBeInTheDocument()
  })

  it('points aria-activedescendant at the active option', () => {
    open()

    const input = screen.getByRole('combobox', { name: 'Search commands' })
    const described = input.getAttribute('aria-activedescendant')

    expect(described).not.toBeNull()
    expect(document.getElementById(described ?? '')).toHaveAttribute('aria-selected', 'true')
  })

  it('reports the full set in aria-setsize, not the rendered window', () => {
    open()

    const options = screen.getAllByRole('option')
    const total = Number(options[0]?.getAttribute('aria-setsize'))

    expect(total).toBeGreaterThan(options.length)
    expect(options[0]).toHaveAttribute('aria-posinset', '1')
  })

  it('filters as the query narrows', () => {
    open()

    fireEvent.change(screen.getByRole('combobox', { name: 'Search commands' }), {
      target: { value: 'undo' },
    })

    const labels = screen.getAllByRole('option').map((option) => option.textContent ?? '')

    expect(labels.some((label) => label.includes('Undo'))).toBe(true)
    expect(labels.some((label) => label.includes('Duplicate'))).toBe(false)
  })

  it('moves the active option with the arrows and runs it on Enter', () => {
    open()

    const input = screen.getByRole('combobox', { name: 'Search commands' })

    fireEvent.change(input, { target: { value: 'motion panel' } })
    fireEvent.change(input, { target: { value: 'panel: motion' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(useStudioStore.getState().ui.leftPanel.tab).toBe('motion')
    expect(useStudioStore.getState().ui.commandPaletteOpen).toBe(false)
  })

  it('does nothing on Tab, so focus cannot leave the palette', () => {
    open()

    const input = screen.getByRole('combobox', { name: 'Search commands' })
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })

    fireEvent(input, event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('remembers the item it just ran, even though running one unmounts it', () => {
    window.localStorage.clear()
    open()

    fireEvent.change(screen.getByRole('combobox', { name: 'Search commands' }), {
      target: { value: 'panel: motion' },
    })
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Search commands' }), { key: 'Enter' })

    expect(JSON.parse(window.localStorage.getItem('motion-studio.palette.recent') ?? '[]')).toEqual(
      ['shortcut:panel-motion'],
    )
  })

  it('says so when nothing matches', () => {
    open()

    fireEvent.change(screen.getByRole('combobox', { name: 'Search commands' }), {
      target: { value: 'zzzzzz' },
    })

    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument()
  })

  /** Settings is the binding still declared unavailable; persistence went live in prompt 50. */
  it('shows an unavailable command greyed rather than hiding it', () => {
    open()

    fireEvent.change(screen.getByRole('combobox', { name: 'Search commands' }), {
      target: { value: 'settings' },
    })

    const option = screen.getAllByRole('option')[0]

    expect(within(option as HTMLElement).getByText(/Settings/)).toBeInTheDocument()
    expect(option).toHaveAttribute('aria-disabled', 'true')
  })
})
