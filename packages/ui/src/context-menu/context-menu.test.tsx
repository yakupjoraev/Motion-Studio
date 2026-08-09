import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { ContextMenu } from './context-menu'

import type { ContextMenuEntry } from './context-menu.types'

beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
  vi.clearAllMocks()
})

const duplicate = vi.fn()
const remove = vi.fn()

const ITEMS: readonly ContextMenuEntry[] = [
  { kind: 'label', id: 'group', label: 'Layer' },
  { id: 'duplicate', label: 'Duplicate', shortcut: 'Mod+D', onSelect: duplicate },
  { kind: 'separator', id: 'rule' },
  { id: 'delete', label: 'Delete', shortcut: 'Delete', danger: true, onSelect: remove },
]

const Fixture = (): ReactElement => (
  <ContextMenu items={ITEMS}>
    <div data-testid="region">Hero</div>
  </ContextMenu>
)

const rightClick = async (): Promise<void> => {
  await userEvent.pointer({ keys: '[MouseRight]', target: screen.getByTestId('region') })
}

describe('ContextMenu', () => {
  it('renders its region and no menu until asked', () => {
    render(<Fixture />)

    expect(screen.getByTestId('region')).toBeInTheDocument()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('renders the region itself rather than a wrapper around it', () => {
    const { container } = render(<Fixture />)

    expect(container.firstElementChild).toBe(screen.getByTestId('region'))
  })

  it('opens on a right click', async () => {
    render(<Fixture />)

    await rightClick()

    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('renders one item per action, with the label and separator as themselves', async () => {
    render(<Fixture />)

    await rightClick()

    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
    expect(screen.getByText('Layer')).toBeInTheDocument()
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('walks the items with the arrow keys and runs one on Enter', async () => {
    render(<Fixture />)

    await rightClick()
    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(duplicate).toHaveBeenCalledTimes(1)
  })

  it('shows the shortcut column', async () => {
    render(<Fixture />)

    await rightClick()

    expect(screen.getByText('Ctrl+D').tagName).toBe('KBD')
  })

  it('states why an item is unavailable, in the shortcut column', async () => {
    render(
      <ContextMenu
        items={[
          {
            id: 'paste',
            label: 'Paste',
            shortcut: 'Mod+V',
            hint: 'Clipboard is empty',
            disabled: true,
            onSelect: vi.fn(),
          },
        ]}
      >
        <div data-testid="region">Hero</div>
      </ContextMenu>,
    )

    await rightClick()

    // A disabled item takes no pointer events, so a tooltip on one would never open — the reason is
    // part of the item instead, and is read out with it.
    expect(screen.getByRole('menuitem', { name: 'Paste Clipboard is empty' })).toHaveAttribute(
      'data-disabled',
    )
    expect(screen.queryByText('Ctrl+V')).not.toBeInTheDocument()
  })

  it('reads a destructive action in the danger colour', async () => {
    render(<Fixture />)

    await rightClick()

    expect(screen.getByRole('menuitem', { name: /Delete/ }).className).toContain('text-danger')
  })

  it('wears the dropdown row height, because the two menus are one object', async () => {
    // Not a second set of `cva` calls: the styles are imported from `Dropdown`, so a drift is impossible.
    render(<Fixture />)

    await rightClick()

    expect(screen.getByRole('menuitem', { name: /Duplicate/ }).className).toContain('h-[26px]')
  })

  it('closes on Escape', async () => {
    render(<Fixture />)

    await rightClick()
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('reports every open and close to the caller', async () => {
    const onOpenChange = vi.fn()
    render(
      <ContextMenu items={ITEMS} onOpenChange={onOpenChange}>
        <div data-testid="region">Hero</div>
      </ContextMenu>,
    )

    await rightClick()
    await userEvent.keyboard('{Escape}')

    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false])
  })

  it('opts its menu into the token-driven overlay animation', async () => {
    render(<Fixture />)

    await rightClick()

    expect(screen.getByRole('menu').closest('[data-ms-overlay]')).not.toBeNull()
  })

  it('is axe clean when open', async () => {
    const { baseElement } = render(<Fixture />)

    await rightClick()

    await expectNoViolations(baseElement)
  })
})
