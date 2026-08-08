import { doc, node, resetFactories, tree, treeId } from '@motion-studio/schema'
import { beforeEach, describe, expect, it } from 'vitest'

import { renameRoot } from '../test/commands'
import { createTestStore } from '../test/create-test-store'

import {
  selectChildren,
  selectDirty,
  selectDocument,
  selectFlatLayers,
  selectNode,
  selectResolvedNode,
  selectRootId,
  selectTheme,
  selectVersion,
} from './document-selectors'

const id = treeId
const shape = { root: ['a', 'b'], a: ['a1'], b: [], a1: [] }
const store = () => createTestStore({ document: doc(tree(shape), { rootId: id('root') }) })

beforeEach(() => {
  resetFactories()
})

describe('the reference-stable readers', () => {
  it('hand back what the state already holds', () => {
    const editor = store()

    editor.getState().dispatch(renameRoot('Landing'))

    const state = editor.getState()

    expect(selectDocument(state)).toBe(state.document)
    expect(selectVersion(state)).toBe(1)
    expect(selectDirty(state)).toBe(true)
    expect(selectRootId(state)).toBe(id('root'))
  })
})

describe('selectNode and selectChildren', () => {
  it('reads one node without walking the tree', () => {
    expect(selectNode(id('a1'))(store().getState())?.name).toBe('a1')
    expect(selectNode(id('nowhere'))(store().getState())).toBeUndefined()
  })

  it('returns the children array the node already holds', () => {
    const state = store().getState()

    expect(selectChildren(id('a'))(state)).toBe(state.document.nodes[id('a')]?.children)
    expect(selectChildren(id('nowhere'))(state)).toEqual([])
  })
})

describe('selectFlatLayers', () => {
  it('flattens in document order with a depth per row', () => {
    expect(selectFlatLayers(store().getState()).map((row) => [row.name, row.depth])).toEqual([
      ['root', 0],
      ['a', 1],
      ['a1', 2],
      ['b', 1],
    ])
  })

  it('reports what a layer row needs to render itself', () => {
    const editor = createTestStore({
      document: doc([
        node({ id: id('root'), name: 'root', slot: 'root', children: [id('a')] }),
        node({ id: id('a'), name: 'a', parentId: id('root'), hidden: true, locked: true }),
      ]),
    })

    expect(selectFlatLayers(editor.getState())[1]).toEqual({
      id: id('a'),
      parentId: id('root'),
      blockId: 'container',
      name: 'a',
      depth: 1,
      hidden: true,
      locked: true,
      hasChildren: false,
    })
  })

  it('returns the identical array until the document changes', () => {
    const editor = store()
    const first = selectFlatLayers(editor.getState())

    expect(selectFlatLayers(editor.getState())).toBe(first)

    editor.getState().dispatch(renameRoot('Landing'))

    const second = selectFlatLayers(editor.getState())

    expect(second).not.toBe(first)
    expect(second[0]?.name).toBe('Landing')
  })

  it('keeps two stores at the same version apart', () => {
    const first = store()
    const second = createTestStore({
      document: doc(tree({ root: ['a'], a: [] }), { rootId: id('root') }),
    })

    expect(selectFlatLayers(first.getState())).toHaveLength(4)
    expect(selectFlatLayers(second.getState())).toHaveLength(2)
  })
})

describe('selectResolvedNode', () => {
  const responsive = () =>
    doc([
      node({
        id: id('root'),
        name: 'root',
        slot: 'root',
        props: { gap: 8, align: 'start' },
        responsive: { lg: { gap: 24 } },
      }),
    ])

  it('folds the overrides in for the active breakpoint', () => {
    const editor = createTestStore({ document: responsive() })
    const select = selectResolvedNode(id('root'))

    expect(select(editor.getState())?.props).toEqual({ gap: 8, align: 'start' })

    editor.getState().setBreakpoint('lg')

    expect(select(editor.getState())?.props).toEqual({ gap: 24, align: 'start' })
  })

  it('memoises on the document and the breakpoint together', () => {
    const editor = createTestStore({ document: responsive() })
    const select = selectResolvedNode(id('root'))
    const first = select(editor.getState())

    expect(select(editor.getState())).toBe(first)

    editor.getState().setBreakpoint('lg')

    expect(select(editor.getState())).not.toBe(first)
  })

  it('is undefined for a node that is not there', () => {
    expect(selectResolvedNode(id('nowhere'))(store().getState())).toBeUndefined()
  })
})

describe('selectTheme', () => {
  it('reads the config out of the document, where it exports from', () => {
    const editor = store()

    expect(selectTheme(editor.getState())).toBe(editor.getState().document.theme)

    editor.getState().applyThemePreset('paper')

    expect(selectTheme(editor.getState()).id).toBe('paper')
  })
})
