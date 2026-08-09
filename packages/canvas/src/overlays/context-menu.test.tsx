import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CanvasMenuAction, CanvasMenuPort } from '../canvas.types'

import { CanvasContextMenu } from './context-menu'

const run = vi.fn()

const port = (unavailable: Partial<Record<CanvasMenuAction, string>> = {}): CanvasMenuPort => ({
  unavailable: (action) => unavailable[action],
  run,
})

const openOn = async (menu: CanvasMenuPort): Promise<void> => {
  render(
    <CanvasContextMenu menu={menu}>
      <div data-testid="region">canvas</div>
    </CanvasContextMenu>,
  )

  await userEvent.pointer({ keys: '[MouseRight]', target: screen.getByTestId('region') })
}

beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
  vi.clearAllMocks()
})

describe('CanvasContextMenu', () => {
  it('renders the canvas itself, with no menu until a right click', () => {
    const { container } = render(
      <CanvasContextMenu menu={port()}>
        <div data-testid="region">canvas</div>
      </CanvasContextMenu>,
    )

    expect(container.firstElementChild).toBe(screen.getByTestId('region'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens with the full item list and its shortcuts', async () => {
    await openOn(port())

    expect(screen.getAllByRole('menuitem')).toHaveLength(12)
    expect(screen.getByRole('menuitem', { name: /Duplicate/ })).toBeInTheDocument()
    expect(screen.getByText('Ctrl+D').tagName).toBe('KBD')
  })

  it('disables what is unavailable and says why in the item', async () => {
    await openOn(port({ paste: 'Clipboard is empty', unwrap: 'Hero has no children' }))

    // The reason is part of the item's own name, so a screen reader reads it with the item.
    expect(screen.getByRole('menuitem', { name: 'Paste Clipboard is empty' })).toHaveAttribute(
      'data-disabled',
    )
    expect(screen.getByText('Hero has no children')).toBeInTheDocument()
  })

  it('asks about availability when it opens, not when it rendered', async () => {
    const menu = port()
    const unavailable = vi.spyOn(menu, 'unavailable')

    render(
      <CanvasContextMenu menu={menu}>
        <div data-testid="region">canvas</div>
      </CanvasContextMenu>,
    )

    expect(unavailable).not.toHaveBeenCalled()

    await userEvent.pointer({ keys: '[MouseRight]', target: screen.getByTestId('region') })

    expect(unavailable).toHaveBeenCalledWith('paste')
  })

  it('runs the item that was chosen', async () => {
    await openOn(port())
    await userEvent.click(screen.getByRole('menuitem', { name: /Duplicate/ }))

    expect(run).toHaveBeenCalledWith('duplicate')
  })
})
