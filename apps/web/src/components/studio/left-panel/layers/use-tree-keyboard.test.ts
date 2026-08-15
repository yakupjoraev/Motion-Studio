import { type NodeId, blockId, nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import type { LayerRowView } from './use-flat-layers'
import { resolveTreeKey } from './use-tree-keyboard'

const id = (name: string): NodeId => nodeId(`node_${name}`)

const row = (
  name: string,
  parent: string | null,
  depth: number,
  extra: Partial<LayerRowView> = {},
): LayerRowView => ({
  id: id(name),
  parentId: parent === null ? null : id(parent),
  blockId: blockId('section'),
  name,
  depth,
  hidden: false,
  locked: false,
  hasChildren: false,
  expanded: false,
  setSize: 1,
  posInSet: 1,
  ...extra,
})

const ROWS: readonly LayerRowView[] = [
  row('root', null, 0, { hasChildren: true, expanded: true }),
  row('a', 'root', 1, { hasChildren: true, expanded: true }),
  row('a1', 'a', 2),
  row('b', 'root', 1, { hasChildren: true, expanded: false }),
]

const press = (key: string, modifiers: { shift?: boolean; mod?: boolean } = {}) =>
  ({ key, shiftKey: modifiers.shift ?? false, modKey: modifiers.mod ?? false }) as const

const on = (name: string, key: string, modifiers?: { shift?: boolean; mod?: boolean }) =>
  resolveTreeKey(press(key, modifiers), { rows: ROWS, focusedId: id(name) })

describe('resolveTreeKey — SHORTCUTS.md § Layers tree', () => {
  it('moves focus with the arrows and stops at the ends', () => {
    expect(on('a', 'ArrowDown')).toEqual({ kind: 'focus', id: id('a1') })
    expect(on('a', 'ArrowUp')).toEqual({ kind: 'focus', id: id('root') })
    expect(on('root', 'ArrowUp')).toBeNull()
    expect(on('b', 'ArrowDown')).toBeNull()
  })

  it('extends the selection with Shift and an arrow', () => {
    expect(on('a', 'ArrowDown', { shift: true })).toEqual({ kind: 'extend', id: id('a1') })
  })

  it('expands with → and collapses with ←', () => {
    expect(on('b', 'ArrowRight')).toEqual({ kind: 'fold', id: id('b'), expanded: true })
    expect(on('a', 'ArrowLeft')).toEqual({ kind: 'fold', id: id('a'), expanded: false })
  })

  it('→ on an open row walks into it, ← on a closed one walks out', () => {
    expect(on('a', 'ArrowRight')).toEqual({ kind: 'focus', id: id('a1') })
    expect(on('b', 'ArrowLeft')).toEqual({ kind: 'focus', id: id('root') })
    expect(on('a1', 'ArrowLeft')).toEqual({ kind: 'focus', id: id('a') })
    expect(on('a1', 'ArrowRight')).toBeNull()
  })

  it('has nowhere left to go from a closed root', () => {
    const closed = [row('root', null, 0, { hasChildren: true, expanded: false })]

    expect(resolveTreeKey(press('ArrowLeft'), { rows: closed, focusedId: id('root') })).toBeNull()
  })

  it('toggles the selection with Space and renames with F2 — ADR-136', () => {
    expect(on('a1', ' ')).toEqual({ kind: 'select', id: id('a1') })
    expect(on('a1', 'F2')).toEqual({ kind: 'rename', id: id('a1') })
  })

  it('leaves Enter to the drag layer', () => {
    expect(on('a1', 'Enter')).toBeNull()
  })

  it('moves the layer among its siblings with Mod and an arrow', () => {
    expect(on('a', 'ArrowDown', { mod: true })).toEqual({
      kind: 'reorder',
      id: id('a'),
      delta: 1,
    })
    expect(on('a', 'ArrowUp', { mod: true })).toEqual({ kind: 'reorder', id: id('a'), delta: -1 })
  })

  it('toggles visibility and lock on the bindings § Edit already owns', () => {
    expect(on('a', 'h', { mod: true, shift: true })).toEqual({ kind: 'visibility', id: id('a') })
    expect(on('a', 'L', { mod: true, shift: true })).toEqual({ kind: 'lock', id: id('a') })
  })

  it('does nothing when no row has focus', () => {
    expect(resolveTreeKey(press('ArrowDown'), { rows: ROWS, focusedId: null })).toBeNull()
  })
})
