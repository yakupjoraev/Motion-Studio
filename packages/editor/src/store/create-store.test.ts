import { NODE_ID_RE, fakeRegistry, nodeId, validateDocument } from '@motion-studio/schema'
import { counterIds } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import type { Command } from '../commands/command.types'
import { createTestStore } from '../test/create-test-store'

import { createEditorStore } from './create-store'

/** Reads the injected context and writes what it found, which is the only way to observe it. */
const stamp = (): Command<null> => ({
  type: 'test/stamp',
  label: 'Stamp',
  payload: null,
  apply(draft, context) {
    const root = draft.nodes[draft.rootId]

    if (root !== undefined) {
      root.name = `${context.generateId()} at ${context.now()}`
    }
  },
})

describe('createEditorStore', () => {
  it('starts on an empty document that passes the structural invariants', () => {
    const store = createTestStore()
    const { document } = store.getState()

    expect(Object.keys(document.nodes)).toHaveLength(1)
    expect(NODE_ID_RE.test(document.rootId)).toBe(true)
    expect(document.meta.id).toMatch(/^doc_/)
    expect(validateDocument(document)).toEqual({ ok: true, value: undefined })
  })

  it('builds the same document twice from the same options', () => {
    expect(createTestStore().getState().document).toEqual(createTestStore().getState().document)
  })

  it('takes a document when it is given one', () => {
    const first = createTestStore()
    const store = createTestStore({ document: first.getState().document })

    expect(store.getState().document).toBe(first.getState().document)
  })

  it('hands commands the injected clock and id generator', () => {
    const store = createTestStore()

    store.getState().dispatch(stamp())

    const { document } = store.getState()

    // `node_3`: the empty document took `node_1` for its root and `node_2` for its own id, which is
    // how one injected generator names both — `documentIds` in `create-store.ts`.
    expect(document.nodes[document.rootId]?.name).toBe('node_3 at 1700000000000')
  })

  it('generates ids of its own when none is injected', () => {
    const store = createEditorStore({ registry: fakeRegistry(), now: () => 0 })
    const { document } = store.getState()

    expect(NODE_ID_RE.test(document.rootId)).toBe(true)
    expect(document.rootId).not.toBe(createTestStore().getState().document.rootId)
  })

  it('keeps two stores apart', () => {
    const first = createTestStore()
    const second = createTestStore()

    first.getState().setLeftTab('layers')

    expect(second.getState().ui.leftPanel.tab).toBe('blocks')
  })

  it('notifies a selector subscription only when its slice changes', () => {
    const store = createTestStore()
    const seen: number[] = []

    const unsubscribe = store.subscribe(
      (state) => state.version,
      (version) => seen.push(version),
    )

    store.getState().setLeftTab('layers')
    store.getState().dispatch(stamp())
    unsubscribe()

    expect(seen).toEqual([1])
  })

  it('accepts an id generator that is not the counter', () => {
    const letters = counterIds('node')
    const store = createEditorStore({
      registry: fakeRegistry(),
      now: () => 0,
      generateId: () => nodeId(letters()),
    })

    expect(store.getState().document.rootId).toBe('node_1')
    expect(store.getState().document.meta.id).toBe('doc_2')
  })
})
