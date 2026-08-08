import { doc, node, resetFactories, tree, treeId } from '@motion-studio/schema'
import { beforeEach, describe, expect, it } from 'vitest'

import { noop, renameRoot } from '../../test/commands'
import { createTestStore } from '../../test/create-test-store'

beforeEach(() => {
  resetFactories()
})

describe('dispatch', () => {
  it('bumps the version and marks the document dirty', () => {
    const store = createTestStore()

    expect(store.getState().version).toBe(0)
    expect(store.getState().dirty).toBe(false)

    store.getState().dispatch(renameRoot('Landing'))

    const state = store.getState()

    expect(state.version).toBe(1)
    expect(state.dirty).toBe(true)
    expect(state.document.nodes[state.document.rootId]?.name).toBe('Landing')
  })

  it('drops a zero-patch command without touching anything', () => {
    const store = createTestStore()
    const before = store.getState().document

    store.getState().dispatch(noop())

    const state = store.getState()

    expect(state.document).toBe(before)
    expect(state.version).toBe(0)
    expect(state.dirty).toBe(false)
    expect(state.history.past).toHaveLength(0)
  })

  it('drops a command that writes the value already there', () => {
    const store = createTestStore()

    store.getState().dispatch(renameRoot('Landing'))
    store.getState().dispatch(renameRoot('Landing'))

    expect(store.getState().version).toBe(1)
  })

  it('replaces the document object rather than mutating it', () => {
    const store = createTestStore()
    const before = store.getState().document

    store.getState().dispatch(renameRoot('Landing'))

    expect(store.getState().document).not.toBe(before)
    expect(before.nodes[before.rootId]?.name).toBe('Page')
  })
})

describe('dispatchBatch', () => {
  it('commits a list as one version bump', () => {
    const store = createTestStore()

    store.getState().dispatchBatch([renameRoot('One'), renameRoot('Two')], 'Rename twice')

    const state = store.getState()

    expect(state.version).toBe(1)
    expect(state.document.nodes[state.document.rootId]?.name).toBe('Two')
  })

  it('drops a batch whose commands all do nothing', () => {
    const store = createTestStore()

    store.getState().dispatchBatch([noop(), noop()], 'Nothing')

    expect(store.getState().version).toBe(0)
  })
})

describe('replaceDocument', () => {
  const loaded = () => doc(tree({ root: ['a'], a: [] }), { rootId: treeId('root') })

  it('swaps the document, bumps the version, and reports it as saved', () => {
    const store = createTestStore()

    store.getState().dispatch(renameRoot('Landing'))
    store.getState().replaceDocument(loaded())

    const state = store.getState()

    expect(state.document.rootId).toBe(treeId('root'))
    expect(state.version).toBe(2)
    expect(state.dirty).toBe(false)
  })

  it('prunes a selection the new document does not contain', () => {
    const gone = node({ name: 'Gone' })
    const store = createTestStore({ document: doc([gone]) })

    store.getState().select([gone.id])
    expect(store.getState().selection.ids).toEqual([gone.id])

    store.getState().replaceDocument(loaded())

    expect(store.getState().selection.ids).toEqual([])
  })

  it('clears history, because a load is not an undo step', () => {
    const store = createTestStore()

    store.getState().replaceDocument(loaded())

    const state = store.getState()

    expect(state.history.past).toHaveLength(0)
    expect(state.history.future).toHaveLength(0)
    expect(state.canUndo).toBe(false)
  })
})
