import { doc, resetFactories, tree, treeId } from '@motion-studio/schema'
import { beforeEach, describe, expect, it } from 'vitest'

import { removeNode } from '../test/commands'
import { createTestStore } from '../test/create-test-store'

import {
  selectAnchorId,
  selectEditingId,
  selectHasSelection,
  selectHoverId,
  selectIsSelected,
  selectIsolationId,
  selectSelectedNodes,
  selectSelection,
  selectSelectionIds,
  selectSoleSelectedId,
} from './selection-selectors'

const id = treeId
const store = () =>
  createTestStore({
    document: doc(tree({ root: ['a', 'b'], a: [], b: [] }), { rootId: id('root') }),
  })

beforeEach(() => {
  resetFactories()
})

describe('selection selectors', () => {
  it('reads the ids without allocating', () => {
    const editor = store()

    editor.getState().select([id('a')])

    expect(selectSelectionIds(editor.getState())).toBe(editor.getState().selection.ids)
    expect(selectHasSelection(editor.getState())).toBe(true)
  })

  it('reads each field of the selection state', () => {
    const editor = store()

    editor.getState().select([id('a')])
    editor.getState().setHover(id('b'))
    editor.getState().setEditing(id('a'))
    editor.getState().enterNode(id('a'))

    const state = editor.getState()

    expect(selectSelection(state)).toBe(state.selection)
    expect(selectAnchorId(state)).toBe(id('a'))
    expect(selectHoverId(state)).toBe(id('b'))
    expect(selectEditingId(state)).toBe(id('a'))
    expect(selectIsolationId(state)).toBe(id('a'))
  })

  it('names a sole selection, and nothing for none or many', () => {
    const editor = store()

    expect(selectSoleSelectedId(editor.getState())).toBeNull()

    editor.getState().select([id('a')])
    expect(selectSoleSelectedId(editor.getState())).toBe(id('a'))

    editor.getState().select([id('b')], 'add')
    expect(selectSoleSelectedId(editor.getState())).toBeNull()
  })

  it('answers whether one id is selected', () => {
    const editor = store()

    editor.getState().select([id('a')])

    expect(selectIsSelected(id('a'))(editor.getState())).toBe(true)
    expect(selectIsSelected(id('b'))(editor.getState())).toBe(false)
  })

  it('resolves the selected nodes and memoises them', () => {
    const editor = store()

    editor.getState().select([id('a'), id('b')])

    const nodes = selectSelectedNodes(editor.getState())

    expect(nodes.map((entry) => entry.name)).toEqual(['a', 'b'])
    expect(selectSelectedNodes(editor.getState())).toBe(nodes)

    editor.getState().select([id('a')])

    expect(selectSelectedNodes(editor.getState()).map((entry) => entry.name)).toEqual(['a'])
  })

  /** Selection is pruned on load, not on every command, so a removal can leave an id dangling. */
  it('skips a selected id whose node has been removed', () => {
    const editor = store()

    editor.getState().select([id('a'), id('b')])
    editor.getState().dispatch(removeNode(id('a')))

    expect(selectSelectedNodes(editor.getState()).map((entry) => entry.name)).toEqual(['b'])
  })
})
