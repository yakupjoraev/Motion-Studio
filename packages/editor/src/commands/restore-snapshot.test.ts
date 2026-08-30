import { doc, tree } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { FLAT_TREE, codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { renameNode } from './rename-node'
import { restoreSnapshot } from './restore-snapshot'

const snapshotOf = (): ReturnType<typeof doc> => doc(tree(FLAT_TREE))

describe('restoreSnapshot', () => {
  it('rolls the content back to the snapshot', () => {
    const harnessed = harness()
    const snapshot = harnessed.document()

    harnessed.store.getState().dispatch(renameNode({ nodeId: id('a'), name: 'Edited' }))
    harnessed.store.getState().dispatch(restoreSnapshot({ document: snapshot }))

    expect(harnessed.document().nodes[id('a')]?.name).toBe(snapshot.nodes[id('a')]?.name)
  })

  it('is undoable', () => {
    const harnessed = harness()
    const snapshot = harnessed.document()

    harnessed.store.getState().dispatch(renameNode({ nodeId: id('a'), name: 'Edited' }))
    harnessed.store.getState().dispatch(restoreSnapshot({ document: snapshot }))
    harnessed.store.getState().undo()

    expect(harnessed.document().nodes[id('a')]?.name).toBe('Edited')
  })

  it('keeps the open document’s identity', () => {
    const harnessed = harness()
    const before = harnessed.document().meta
    const snapshot = { ...snapshotOf(), meta: { ...before, id: 'doc_other', name: 'Older name' } }

    harnessed.store.getState().dispatch(restoreSnapshot({ document: snapshot }))

    const after = harnessed.document().meta

    expect(after.id).toBe(before.id)
    expect(after.createdAt).toBe(before.createdAt)
    // Everything that is content, and not identity, does come back.
    expect(after.name).toBe('Older name')
  })

  it('does not import a template flag from the snapshot', () => {
    const harnessed = harness()
    const snapshot = snapshotOf()

    harnessed.store
      .getState()
      .dispatch(
        restoreSnapshot({ document: { ...snapshot, meta: { ...snapshot.meta, template: true } } }),
      )

    expect(harnessed.document().meta.template).toBeUndefined()
  })

  it('rejects a snapshot that is not a document', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(restoreSnapshot({ document: { nodes: {} } as never })),
      ),
    ).toBe(COMMAND_CODES.invalidMeta)
  })
})
