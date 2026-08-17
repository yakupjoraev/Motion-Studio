import { blockRegistry } from '@motion-studio/blocks/registry'
import type { BlockDefinition } from '@motion-studio/schema'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DndHost } from '../../dnd-host'

import { BLOCK_GRID_COLUMNS, BlockGrid, resolveGridKey } from './block-grid'

const BLOCKS = blockRegistry.list()

const state = { count: 9, columns: 2, focusedIndex: 0, pageRows: 3 }

describe('resolveGridKey', () => {
  it('moves within a row with the horizontal arrows and stops at its edges', () => {
    expect(resolveGridKey('ArrowRight', state)).toBe(1)
    expect(resolveGridKey('ArrowRight', { ...state, focusedIndex: 1 })).toBeNull()
    expect(resolveGridKey('ArrowLeft', { ...state, focusedIndex: 1 })).toBe(0)
    expect(resolveGridKey('ArrowLeft', state)).toBeNull()
  })

  it('moves between rows with the vertical arrows and stops at the ends', () => {
    expect(resolveGridKey('ArrowDown', state)).toBe(2)
    expect(resolveGridKey('ArrowUp', { ...state, focusedIndex: 2 })).toBe(0)
    expect(resolveGridKey('ArrowUp', state)).toBeNull()
    // Nine cards in rows of two: index 8 is alone on the last row.
    expect(resolveGridKey('ArrowDown', { ...state, focusedIndex: 8 })).toBeNull()
  })

  it('takes Home and End to the edges of the current row', () => {
    expect(resolveGridKey('End', { ...state, focusedIndex: 2 })).toBe(3)
    expect(resolveGridKey('Home', { ...state, focusedIndex: 3 })).toBe(2)
    expect(resolveGridKey('Home', { ...state, focusedIndex: 2 })).toBeNull()
    // A row with one card in it: both keys are already where they would go.
    expect(resolveGridKey('End', { ...state, focusedIndex: 8 })).toBeNull()
  })

  it('moves a viewport at a time with the page keys, clamped to the ends', () => {
    expect(resolveGridKey('PageDown', state)).toBe(6)
    expect(resolveGridKey('PageUp', { ...state, focusedIndex: 6 })).toBe(0)
    // Past the end clamps to the last card rather than doing nothing.
    expect(resolveGridKey('PageDown', { ...state, focusedIndex: 6 })).toBe(8)
    expect(resolveGridKey('PageDown', { ...state, focusedIndex: 8 })).toBeNull()
  })

  it('owns no other key and no empty grid', () => {
    expect(resolveGridKey('Enter', state)).toBeNull()
    expect(resolveGridKey('ArrowDown', { ...state, count: 0 })).toBeNull()
  })
})

const grid = (blocks: readonly BlockDefinition[] = BLOCKS, onInsert = vi.fn()) =>
  render(
    <DndHost>
      <BlockGrid blocks={blocks} onInsert={onInsert} />
    </DndHost>,
  )

beforeEach(() => {
  // jsdom measures nothing, and a virtualizer with a zero-height viewport renders no rows.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 600 })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 280 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 600 })
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 10000 })
})

describe('BlockGrid', () => {
  it('states the size of the whole virtual set, not the size of the rendered window', () => {
    grid()

    const rows = screen.getAllByRole('row')
    const expected = Math.ceil(BLOCKS.length / BLOCK_GRID_COLUMNS)

    expect(screen.getByRole('grid', { name: 'Blocks' })).toHaveAttribute(
      'aria-rowcount',
      String(expected),
    )
    expect(rows[0]).toHaveAttribute('aria-rowindex', '1')
    // ADR-180: a grid row carries no `aria-setsize` — `aria-rowcount` above is that statement.
    expect(rows[0]).not.toHaveAttribute('aria-setsize')
    expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0)
  })

  it('names a card by its block and its category, and calls it a draggable block', () => {
    grid()

    const card = screen.getByRole('button', { name: 'Section, layout block' })

    expect(card).toHaveAttribute('aria-roledescription', 'draggable block')
  })

  it('keeps one tab stop for the whole grid and moves it with the arrows', async () => {
    grid()

    const first = screen.getByRole('button', { name: 'Section, layout block' })
    const second = screen.getAllByRole('button')[1]

    expect(first).toHaveAttribute('tabindex', '0')
    expect(second).toHaveAttribute('tabindex', '-1')

    await act(async () => {
      first.focus()
    })
    await act(async () => {
      fireEvent.keyDown(first, { key: 'ArrowRight' })
    })

    expect(screen.getAllByRole('button')[1]).toHaveAttribute('tabindex', '0')
    expect(first).toHaveAttribute('tabindex', '-1')
  })

  it('inserts the focused card on Enter', async () => {
    const onInsert = vi.fn()

    grid(BLOCKS, onInsert)

    const card = screen.getByRole('button', { name: 'Section, layout block' })

    await act(async () => {
      fireEvent.keyDown(card, { key: 'Enter' })
    })

    expect(onInsert).toHaveBeenCalledWith(BLOCKS[0])
  })
})
