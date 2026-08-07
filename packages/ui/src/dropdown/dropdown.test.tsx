import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Dropdown } from './dropdown'

import type { DropdownEntry } from './dropdown.types'

/** Radix menus reach for pointer capture and measurement that jsdom does not implement. */
beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
  // The handlers below are shared by the fixture, so each test starts from a clean count.
  vi.clearAllMocks()
})

const duplicate = vi.fn()
const remove = vi.fn()

const ITEMS: readonly DropdownEntry[] = [
  { kind: 'label', id: 'group', label: 'Layer' },
  { id: 'duplicate', label: 'Duplicate', shortcut: 'Mod+D', onSelect: duplicate },
  { id: 'lock', label: 'Lock', disabled: true, onSelect: vi.fn() },
  { kind: 'separator', id: 'rule' },
  { id: 'delete', label: 'Delete', shortcut: 'Delete', danger: true, onSelect: remove },
]

const Fixture = (): ReactElement => (
  <Dropdown items={ITEMS} trigger={<button type="button">Actions</button>} />
)

const openIt = async (): Promise<void> => {
  await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
}

describe('Dropdown', () => {
  it('renders only the trigger while closed', () => {
    render(<Fixture />)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens on click, with the menu named by the trigger that opened it', async () => {
    // Radix sets `aria-labelledby` to the trigger. An `aria-label` here would be silently overridden, so
    // the component does not offer one — the name follows the button and cannot drift from it.
    render(<Fixture />)

    await openIt()

    expect(screen.getByRole('menu', { name: 'Actions' })).toBeInTheDocument()
  })

  it('renders one menu item per action, and nothing for the other entries', async () => {
    render(<Fixture />)

    await openIt()

    // Three actions; the group label and the separator are not items.
    expect(screen.getAllByRole('menuitem')).toHaveLength(3)
    expect(screen.getByText('Layer')).toBeInTheDocument()
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('walks the items with the arrow keys and runs one on Enter', async () => {
    render(<Fixture />)

    await openIt()
    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(duplicate).toHaveBeenCalledTimes(1)
  })

  it('skips a disabled item when moving down', async () => {
    render(<Fixture />)

    await openIt()
    // Duplicate, then Lock is skipped, so the second press lands on Delete.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    expect(remove).toHaveBeenCalledTimes(1)
  })

  it('runs an item on click', async () => {
    render(<Fixture />)

    await openIt()
    await userEvent.click(screen.getByRole('menuitem', { name: /Duplicate/ }))

    expect(duplicate).toHaveBeenCalledTimes(1)
  })

  it('does not run a disabled item', async () => {
    const onSelect = vi.fn()
    render(
      <Dropdown
        items={[{ id: 'lock', label: 'Lock', disabled: true, onSelect }]}
        trigger={<button type="button">Actions</button>}
      />,
    )

    await openIt()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Lock' }))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('shows the shortcut in its own column, rendered as a key cap', async () => {
    render(<Fixture />)

    await openIt()

    const hint = screen.getByText('Ctrl+D')

    expect(hint.tagName).toBe('KBD')
    expect(hint.className).toContain('ml-auto')
  })

  it('reads a destructive action in the danger colour', async () => {
    render(<Fixture />)

    await openIt()

    expect(screen.getByRole('menuitem', { name: /Delete/ }).className).toContain('text-danger')
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<Fixture />)

    await openIt()
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus()
  })

  it('takes its row height from the density scale', async () => {
    render(<Fixture />)

    await openIt()

    expect(screen.getByRole('menuitem', { name: /Duplicate/ }).className).toContain('h-[26px]')
  })

  it('opts its menu into the token-driven overlay animation', async () => {
    render(<Fixture />)

    await openIt()

    expect(screen.getByRole('menu').closest('[data-ms-overlay]')).not.toBeNull()
  })

  it('is axe clean when open', async () => {
    const { baseElement } = render(<Fixture />)

    await openIt()

    await expectNoViolations(baseElement)
  })
})
