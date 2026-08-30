import { type MotionDocument, createEmptyDocument, nodeId } from '@motion-studio/schema'
import { counterIds } from '@motion-studio/utils'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  SNAPSHOT_LIMIT,
  deleteDocument,
  listDocumentIds,
  listSnapshots,
  loadDocument,
  loadSnapshot,
  saveDocument,
  takeSnapshot,
} from './document-store'
import { closeDatabase } from './idb'

const documentOf = (name: string): MotionDocument => {
  const ids = counterIds(name)

  return createEmptyDocument({
    name,
    ids: (prefix) => `${prefix}_${ids()}`,
    now: () => new Date(0),
  })
}

/** A node added by hand: the ring buffer's rule is about node count, so a test needs to move it. */
const withNodes = (document: MotionDocument, count: number): MotionDocument => {
  const extra = Array.from({ length: count }, (_, index) => nodeId(`node_extra${index}`))

  return {
    ...document,
    nodes: {
      ...document.nodes,
      ...Object.fromEntries(
        extra.map((id) => [
          id,
          {
            ...document.nodes[document.rootId],
            id,
            parentId: document.rootId,
            children: [],
            slot: 'root',
          },
        ]),
      ),
    },
  } as MotionDocument
}

beforeEach(() => {
  closeDatabase()
  globalThis.indexedDB = new IDBFactory()
})

describe('document store', () => {
  it('round-trips a document', async () => {
    const document = documentOf('landing')

    await saveDocument(document, 1000)

    const stored = await loadDocument(document.meta.id)

    expect(stored?.document.meta.name).toBe('landing')
    expect(stored?.savedAt).toBe(1000)
  })

  it('reports an unknown document as missing rather than throwing', async () => {
    await expect(loadDocument('doc_nothing')).resolves.toBeUndefined()
  })

  it('drops a record an older build wrote in a shape the schema rejects', async () => {
    const document = documentOf('broken')

    await saveDocument(document, 1)
    await saveDocument({ ...document, rootId: undefined } as unknown as MotionDocument, 2)

    await expect(loadDocument(document.meta.id)).resolves.toBeUndefined()
  })

  it('lists the documents it holds', async () => {
    await saveDocument(documentOf('one'), 1)
    await saveDocument(documentOf('two'), 2)

    await expect(listDocumentIds()).resolves.toHaveLength(2)
  })

  it('deletes a document and its snapshots', async () => {
    const document = documentOf('gone')

    await saveDocument(document, 1)
    await takeSnapshot(document, 1)
    await deleteDocument(document.meta.id)

    await expect(loadDocument(document.meta.id)).resolves.toBeUndefined()
    await expect(listSnapshots(document.meta.id)).resolves.toEqual([])
  })

  it('keeps snapshots of other documents when one is deleted', async () => {
    const kept = documentOf('kept')
    const removed = documentOf('removed')

    await takeSnapshot(kept, 1)
    await takeSnapshot(removed, 1)
    await deleteDocument(removed.meta.id)

    await expect(listSnapshots(kept.meta.id)).resolves.toHaveLength(1)
  })
})

describe('the snapshot ring buffer', () => {
  it('caps at ten and drops the oldest', async () => {
    const document = documentOf('ring')

    for (let index = 0; index < 14; index += 1) {
      await takeSnapshot(document, 1000 + index)
    }

    const snapshots = await listSnapshots(document.meta.id)

    expect(snapshots).toHaveLength(SNAPSHOT_LIMIT)
    expect(snapshots.map((snapshot) => snapshot.createdAt)).toEqual([
      1013, 1012, 1011, 1010, 1009, 1008, 1007, 1006, 1005, 1004,
    ])
  })

  it('lists newest first, with the node count of each', async () => {
    const document = documentOf('counts')

    await takeSnapshot(document, 10)
    await takeSnapshot(withNodes(document, 3), 20)

    const snapshots = await listSnapshots(document.meta.id)

    expect(snapshots.map((snapshot) => snapshot.nodeCount)).toEqual([4, 1])
  })

  it('reads a snapshot back as the document it was', async () => {
    const document = withNodes(documentOf('restore'), 2)
    const { key } = await takeSnapshot(document, 5)

    await expect(loadSnapshot(key)).resolves.toEqual(document)
  })
})
