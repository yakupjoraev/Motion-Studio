import { commands, type selectors } from '@motion-studio/editor'
import {
  type BlockId,
  type NodeId,
  blockId,
  createEmptyDocument,
  nodeId,
} from '@motion-studio/schema'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useStudioStore } from '../../../../store/editor-store'

import { flattenLayers, useFlatLayers } from './use-flat-layers'

const id = (name: string): NodeId => nodeId(`node_${name}`)

const row = (
  name: string,
  parent: string | null,
  depth: number,
  hasChildren = false,
): selectors.LayerRow => ({
  id: id(name),
  parentId: parent === null ? null : id(parent),
  blockId: blockId('section'),
  name,
  depth,
  hidden: false,
  locked: false,
  hasChildren,
})

/** root ▸ a ▸ (a1, a2) and root ▸ b — the smallest shape with a subtree and a sibling after it. */
const ROWS: readonly selectors.LayerRow[] = [
  row('root', null, 0, true),
  row('a', 'root', 1, true),
  row('a1', 'a', 2),
  row('a2', 'a', 2),
  row('b', 'root', 1),
]

const blockName = (block: BlockId): string => (block === blockId('section') ? 'Section' : block)

const flatten = (collapsed: readonly string[] = [], query = '') =>
  flattenLayers({
    rows: ROWS,
    collapsed: new Set(collapsed.map(id)),
    query,
    blockName,
  })

describe('flattenLayers', () => {
  it('lists every node in document order with its depth', () => {
    const { rows, searching } = flatten()

    expect(rows.map((entry) => entry.name)).toEqual(['root', 'a', 'a1', 'a2', 'b'])
    expect(rows.map((entry) => entry.depth)).toEqual([0, 1, 2, 2, 1])
    expect(searching).toBe(false)
  })

  it('excludes a collapsed subtree, so folding is also what makes it free', () => {
    const { rows } = flatten(['a'])

    expect(rows.map((entry) => entry.name)).toEqual(['root', 'a', 'b'])
    expect(rows[1]?.expanded).toBe(false)
  })

  it('counts the set a screen reader hears from the siblings, not from the window', () => {
    const { rows } = flatten()
    const byName = new Map(rows.map((entry) => [entry.name, entry]))

    expect(byName.get('a')).toMatchObject({ setSize: 2, posInSet: 1 })
    expect(byName.get('b')).toMatchObject({ setSize: 2, posInSet: 2 })
    expect(byName.get('a2')).toMatchObject({ setSize: 2, posInSet: 2 })
    expect(byName.get('root')).toMatchObject({ setSize: 1, posInSet: 1 })
  })

  it('shows a match with its ancestors and opens the path, folded or not', () => {
    const { rows, matchCount, searching } = flatten(['a'], 'a1')

    expect(rows.map((entry) => entry.name)).toEqual(['root', 'a', 'a1'])
    expect(rows[1]?.expanded).toBe(true)
    expect(matchCount).toBe(1)
    expect(searching).toBe(true)
  })

  it('matches the block name as well as the layer name', () => {
    const { matchCount } = flatten([], 'section')

    expect(matchCount).toBe(ROWS.length)
  })

  it('counts matches, not the ancestors shown to reach them', () => {
    expect(flatten([], 'a2').matchCount).toBe(1)
  })
})

const state = () => useStudioStore.getState()

let counter = 0

const nextId = (): NodeId => {
  counter += 1

  return nodeId(`node_f${counter}`)
}

describe('useFlatLayers', () => {
  beforeEach(() => {
    act(() => {
      state().replaceDocument(createEmptyDocument({ ids: () => nextId() }))
    })
  })

  it('returns the same list until the document changes', () => {
    const collapsed = new Set<NodeId>()
    const { result, rerender } = renderHook(() => useFlatLayers(collapsed, ''))
    const first = result.current.rows

    rerender()

    expect(result.current.rows).toBe(first)

    act(() => {
      state().dispatch(
        commands.insertBlock({
          blockId: blockId('section'),
          parentId: state().document.rootId,
          index: 0,
          slot: 'children',
          id: nextId(),
        }),
      )
    })

    expect(result.current.rows).not.toBe(first)
    expect(result.current.rows).toHaveLength(2)
  })
})
