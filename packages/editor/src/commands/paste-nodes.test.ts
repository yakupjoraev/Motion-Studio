import {
  type Asset,
  type MotionDocument,
  type NodeId,
  assetId,
  doc,
  fixtureBlockId,
  node,
  tree,
  validateDocument,
} from '@motion-studio/schema'
import { assertDefined } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import type { SerializedSubtree } from '../clipboard/clipboard.types'
import { deserializeSubtree } from '../clipboard/deserialize-subtree'
import { serializeSubtree } from '../clipboard/serialize-subtree'
import { type Harness, codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { pasteNodes } from './paste-nodes'

const asset = (): Asset => ({
  id: assetId('asset_hero'),
  kind: 'image',
  source: { type: 'url', url: 'https://images.example.com/hero.webp' },
  width: 1200,
  height: 800,
  alt: 'Hero',
})

/** Five nodes under one root, which is the paste the prompt asks to see as one undo step. */
const five = (): MotionDocument =>
  doc(
    tree({ root: ['a'], a: ['a1', 'a2'], a1: ['a1x', 'a1y'] }).map((entry) =>
      entry.id === id('a1x') ? { ...entry, props: { image: 'asset_hero' } } : entry,
    ),
    { assets: { [assetId('asset_hero')]: asset() } },
  )

const prepared = (harnessed: Harness, from: MotionDocument, rootIds: readonly NodeId[]) => {
  const result = deserializeSubtree(serializeSubtree(from, rootIds), {
    registry: harnessed.context.registry,
    generateId: harnessed.context.generateId,
    document: harnessed.document(),
  })

  if (!result.ok) {
    throw result.error
  }

  return result.value.subtree
}

const rootOf = (subtree: SerializedSubtree): NodeId =>
  assertDefined(subtree.rootIds[0], 'the subtree has a root')

describe('pasteNodes', () => {
  it('inserts the subtree at the index, reparented onto the target', () => {
    const harnessed = harness()
    const subtree = prepared(harnessed, five(), [id('a')])
    const rootId = rootOf(subtree)

    harnessed.store
      .getState()
      .dispatch(pasteNodes({ subtree, parentId: id('root'), slot: 'children', index: 1 }))

    const document = harnessed.document()

    expect(document.nodes[id('root')]?.children[1]).toBe(rootId)
    expect(document.nodes[rootId]?.parentId).toBe(id('root'))
    expect(document.nodes[rootId]?.slot).toBe('children')
    expect(validateDocument(document)).toEqual({ ok: true, value: undefined })
  })

  it('writes five nodes as one history entry', () => {
    const harnessed = harness()
    const subtree = prepared(harnessed, five(), [id('a')])

    harnessed.store
      .getState()
      .dispatch(pasteNodes({ subtree, parentId: id('root'), slot: 'children', index: 0 }))

    expect(Object.keys(subtree.nodes)).toHaveLength(5)
    expect(harnessed.store.getState().history.past).toHaveLength(1)
  })

  it('carries the assets the payload references', () => {
    const harnessed = harness()
    const subtree = prepared(harnessed, five(), [id('a')])

    harnessed.store
      .getState()
      .dispatch(pasteNodes({ subtree, parentId: id('root'), slot: 'children', index: 0 }))

    expect(Object.keys(harnessed.document().assets)).toHaveLength(1)
  })

  it('keeps the roots in the order they were copied', () => {
    const harnessed = harness()
    const from = doc(tree({ root: ['a', 'b'] }))
    const subtree = prepared(harnessed, from, [id('a'), id('b')])

    harnessed.store
      .getState()
      .dispatch(pasteNodes({ subtree, parentId: id('root'), slot: 'children', index: 0 }))

    expect(harnessed.document().nodes[id('root')]?.children.slice(0, 2)).toEqual([
      ...subtree.rootIds,
    ])
  })

  it('rejects a locked parent', () => {
    const document = doc(
      tree({ root: ['a'] }).map((entry) =>
        entry.id === id('root') ? { ...entry, locked: true } : entry,
      ),
    )
    const harnessed = harness({ document })
    const subtree = prepared(harnessed, five(), [id('a')])

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(pasteNodes({ subtree, parentId: id('root'), slot: 'children', index: 0 })),
      ),
    ).toBe(COMMAND_CODES.lockedNode)
  })

  it('rejects a slot that does not accept the pasted block', () => {
    const document = doc([
      node({
        id: id('root'),
        blockId: fixtureBlockId('section'),
        slot: 'root',
        children: [],
      }),
    ])
    const harnessed = harness({ document })
    const leaves = doc([
      node({ id: id('page'), slot: 'root', children: [id('leaf')] }),
      node({ id: id('leaf'), blockId: fixtureBlockId('leaf'), parentId: id('page') }),
    ])
    const subtree = prepared(harnessed, leaves, [id('leaf')])

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(pasteNodes({ subtree, parentId: id('root'), slot: 'children', index: 0 })),
      ),
    ).toBe(COMMAND_CODES.slotRejectsBlock)
  })

  it('rejects a paste that would overfill the slot, leaving the document alone', () => {
    const document = doc([
      node({
        id: id('root'),
        blockId: fixtureBlockId('section'),
        slot: 'root',
        children: [],
      }),
    ])
    const harnessed = harness({ document })
    const cards = doc([
      node({ id: id('page'), slot: 'root', children: [id('c1'), id('c2'), id('c3')] }),
      node({ id: id('c1'), blockId: fixtureBlockId('card'), parentId: id('page') }),
      node({ id: id('c2'), blockId: fixtureBlockId('card'), parentId: id('page') }),
      node({ id: id('c3'), blockId: fixtureBlockId('card'), parentId: id('page') }),
    ])
    const subtree = prepared(harnessed, cards, [id('c1'), id('c2'), id('c3')])

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(pasteNodes({ subtree, parentId: id('root'), slot: 'children', index: 0 })),
      ),
    ).toBe(COMMAND_CODES.slotFull)
    expect(harnessed.document()).toEqual(document)
  })
})
