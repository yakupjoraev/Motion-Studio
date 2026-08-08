import { doc, fixtureBlockId, node, nodeId, tree, validateDocument } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { moveNodes } from './move-nodes'

const deep = (): ReturnType<typeof doc> => doc(tree({ root: ['a', 'b'], a: ['a1'], a1: ['a2'] }))

const childrenOf = (document: ReturnType<typeof doc>, parent: string): readonly string[] =>
  document.nodes[id(parent)]?.children ?? []

describe('moveNodes', () => {
  it('moves a node to a later index in its own parent without the off-by-one', () => {
    const harnessed = harness()

    harnessed.store
      .getState()
      .dispatch(moveNodes({ ids: [id('a')], parentId: id('root'), index: 2 }))

    expect(childrenOf(harnessed.document(), 'root')).toEqual([id('b'), id('c'), id('a'), id('d')])
  })

  it('reparents and keeps the document valid', () => {
    const harnessed = harness({ document: deep() })

    harnessed.store.getState().dispatch(moveNodes({ ids: [id('b')], parentId: id('a'), index: 0 }))

    const document = harnessed.document()

    expect(childrenOf(document, 'a')).toEqual([id('b'), id('a1')])
    expect(document.nodes[id('b')]?.parentId).toBe(id('a'))
    expect(validateDocument(document)).toEqual({ ok: true, value: undefined })
  })

  it('keeps the relative document order of a multi-move', () => {
    const harnessed = harness({ document: deep() })

    harnessed.store
      .getState()
      .dispatch(moveNodes({ ids: [id('b'), id('a')], parentId: id('root'), index: 0 }))

    expect(childrenOf(harnessed.document(), 'root')).toEqual([id('a'), id('b')])
  })

  it('rejects a move into the node itself', () => {
    const harnessed = harness({ document: deep() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(moveNodes({ ids: [id('a')], parentId: id('a'), index: 0 })),
      ),
    ).toBe(COMMAND_CODES.moveIntoDescendant)
  })

  it('rejects a move into a child of the node', () => {
    const harnessed = harness({ document: deep() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(moveNodes({ ids: [id('a')], parentId: id('a1'), index: 0 })),
      ),
    ).toBe(COMMAND_CODES.moveIntoDescendant)
  })

  it('rejects a move into a grandchild of the node', () => {
    const harnessed = harness({ document: deep() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(moveNodes({ ids: [id('a')], parentId: id('a2'), index: 0 })),
      ),
    ).toBe(COMMAND_CODES.moveIntoDescendant)
  })

  it('refuses to move the root', () => {
    const harnessed = harness({ document: deep() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(moveNodes({ ids: [id('root')], parentId: id('a'), index: 0 })),
      ),
    ).toBe(COMMAND_CODES.rootProtected)
  })

  it('rejects a locked target parent', () => {
    const document = doc([
      node({ id: id('root'), slot: 'root', children: [id('a'), id('b')] }),
      node({ id: id('a'), parentId: id('root'), locked: true }),
      node({ id: id('b'), parentId: id('root') }),
    ])
    const harnessed = harness({ document })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(moveNodes({ ids: [id('b')], parentId: id('a'), index: 0 })),
      ),
    ).toBe(COMMAND_CODES.lockedNode)
  })

  it('rejects a target slot that does not accept the block', () => {
    const document = doc([
      node({ id: id('root'), slot: 'root', children: [id('a'), id('b')] }),
      node({ id: id('a'), blockId: fixtureBlockId('section'), parentId: id('root') }),
      node({ id: id('b'), blockId: fixtureBlockId('leaf'), parentId: id('root') }),
    ])
    const harnessed = harness({ document })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(moveNodes({ ids: [id('b')], parentId: id('a'), index: 0, slot: 'children' })),
      ),
    ).toBe(COMMAND_CODES.slotRejectsBlock)
  })

  it('rejects a move that would overfill the target slot', () => {
    const document = doc([
      node({ id: id('root'), slot: 'root', children: [id('a'), id('b'), id('c'), id('d')] }),
      node({
        id: id('a'),
        blockId: fixtureBlockId('section'),
        parentId: id('root'),
        children: [],
      }),
      node({ id: id('b'), blockId: fixtureBlockId('card'), parentId: id('root') }),
      node({ id: id('c'), blockId: fixtureBlockId('card'), parentId: id('root') }),
      node({ id: id('d'), blockId: fixtureBlockId('card'), parentId: id('root') }),
    ])
    const harnessed = harness({ document })

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(
          moveNodes({
            ids: [id('b'), id('c'), id('d')],
            parentId: id('a'),
            index: 0,
            slot: 'children',
          }),
        ),
      ),
    ).toBe(COMMAND_CODES.slotFull)
  })

  it('reports a node that is not there', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(moveNodes({ ids: [nodeId('node_absent')], parentId: id('root'), index: 0 })),
      ),
    ).toBe('NODE_NOT_FOUND')
  })
})
