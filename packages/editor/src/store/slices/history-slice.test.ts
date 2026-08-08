import { describe, expect, it } from 'vitest'

import { renameRoot } from '../../test/commands'
import { createTestStore } from '../../test/create-test-store'

/**
 * The stub's contract, written down so prompt 15 has something to break: dispatch reaches the seam,
 * nothing accumulates yet, and the operations that need entries are no-ops rather than throws.
 */
describe('history stub', () => {
  it('starts empty and stays empty across a dispatch', () => {
    const store = createTestStore()

    store.getState().dispatch(renameRoot('Landing'))

    const state = store.getState()

    expect(state.history.past).toHaveLength(0)
    expect(state.history.future).toHaveLength(0)
    expect(state.canUndo).toBe(false)
    expect(state.canRedo).toBe(false)
  })

  it('leaves the document alone on undo and redo', () => {
    const store = createTestStore()

    store.getState().dispatch(renameRoot('Landing'))

    const document = store.getState().document

    store.getState().undo()
    store.getState().redo()

    expect(store.getState().document).toBe(document)
  })

  it('accepts a transaction that spans commands without swallowing them', () => {
    const store = createTestStore()

    store.getState().beginTransaction('Two renames')
    store.getState().dispatch(renameRoot('One'))
    store.getState().dispatch(renameRoot('Two'))
    store.getState().endTransaction()

    const state = store.getState()

    expect(state.document.nodes[state.document.rootId]?.name).toBe('Two')
    expect(state.version).toBe(2)
  })

  it('clears to an empty history', () => {
    const store = createTestStore()

    store.getState().clearHistory()

    expect(store.getState().history).toEqual({ past: [], future: [] })
    expect(store.getState().canUndo).toBe(false)
  })
})

describe('clipboard stub', () => {
  it('holds nothing until prompt 16 fills it', () => {
    expect(createTestStore().getState().clipboard).toEqual({ nodes: null, style: null })
  })
})
