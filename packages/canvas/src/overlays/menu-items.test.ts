import { describe, expect, it, vi } from 'vitest'

import type { CanvasMenuAction, CanvasMenuPort } from '../canvas.types'

import { CANVAS_MENU_ITEMS, canvasMenuEntries } from './menu-items'

const port = (unavailable: Partial<Record<CanvasMenuAction, string>> = {}): CanvasMenuPort => ({
  unavailable: (action) => unavailable[action],
  run: vi.fn(),
})

const actions = (entries: readonly { id: string; kind?: string }[]): string[] =>
  entries.filter((entry) => entry.kind === undefined).map((entry) => entry.id)

describe('canvasMenuEntries', () => {
  it('offers every action PRODUCT.md § 3 lists, in its order', () => {
    expect(actions(canvasMenuEntries(port()))).toEqual([
      'duplicate',
      'copy',
      'paste',
      'pasteStyle',
      'delete',
      'bringForward',
      'sendBackward',
      'wrap',
      'unwrap',
      'addMotion',
      'copyReact',
      'resetOverrides',
    ])
  })

  it('carries the binding SHORTCUTS.md assigns, and none where it assigns none — ADR-098', () => {
    const entries = canvasMenuEntries(port())
    const shortcut = (id: string) =>
      entries.find((entry) => entry.id === id) as { shortcut?: string }

    expect(shortcut('duplicate').shortcut).toBe('Mod+D')
    expect(shortcut('unwrap').shortcut).toBe('Mod+Shift+G')
    expect(shortcut('copyReact').shortcut).toBeUndefined()
  })

  it('disables an unavailable item and states the reason in it — ADR-095', () => {
    const entries = canvasMenuEntries(port({ paste: 'Clipboard is empty' }))
    const paste = entries.find((entry) => entry.id === 'paste') as {
      disabled?: boolean
      hint?: string
      shortcut?: string
    }

    expect(paste.disabled).toBe(true)
    expect(paste.hint).toBe('Clipboard is empty')
    // The reason takes the shortcut's column: a disabled item's shortcut would not fire either.
    expect(paste.shortcut).toBeUndefined()
  })

  it('marks the destructive action and separates the groups', () => {
    const entries = canvasMenuEntries(port())

    expect(entries.find((entry) => entry.id === 'delete')).toMatchObject({ danger: true })
    expect(entries.filter((entry) => entry.kind === 'separator')).toHaveLength(3)
  })

  it('runs the action it was asked for', () => {
    const menu = port()
    const entries = canvasMenuEntries(menu)
    const duplicate = entries.find((entry) => entry.id === 'duplicate') as {
      onSelect: () => void
    }

    duplicate.onSelect()

    expect(menu.run).toHaveBeenCalledWith('duplicate')
  })

  it('names every item, so the table and the type cannot drift apart', () => {
    for (const item of CANVAS_MENU_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0)
    }
  })
})
