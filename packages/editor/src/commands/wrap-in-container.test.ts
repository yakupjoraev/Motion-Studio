import { doc, fixtureBlockId, node, nodeId, tree, validateDocument } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { wrapInContainer } from './wrap-in-container'

const CONTAINER = fixtureBlockId('container')

describe('wrapInContainer', () => {
  it('creates the container where the first node was and moves the selection into it', () => {
    const harnessed = harness()

    harnessed.store
      .getState()
      .dispatch(wrapInContainer({ ids: [id('b'), id('c')], blockId: CONTAINER }))

    const document = harnessed.document()
    const container = nodeId('node_1')

    expect(document.nodes[id('root')]?.children).toEqual([id('a'), container, id('d')])
    expect(document.nodes[container]?.children).toEqual([id('b'), id('c')])
    expect(document.nodes[id('b')]?.parentId).toBe(container)
    expect(validateDocument(document)).toEqual({ ok: true, value: undefined })
  })

  it('is one undo step', () => {
    const harnessed = harness()

    harnessed.store
      .getState()
      .dispatch(wrapInContainer({ ids: [id('b'), id('c')], blockId: CONTAINER }))

    expect(harnessed.store.getState().version).toBe(1)
  })

  it('wraps in document order whatever order the ids arrive in', () => {
    const harnessed = harness()

    harnessed.store
      .getState()
      .dispatch(wrapInContainer({ ids: [id('c'), id('a')], blockId: CONTAINER }))

    expect(harnessed.document().nodes[nodeId('node_1')]?.children).toEqual([id('a'), id('c')])
  })

  it('takes the container id the caller chose', () => {
    const harnessed = harness()

    harnessed.store
      .getState()
      .dispatch(wrapInContainer({ ids: [id('a')], blockId: CONTAINER, id: nodeId('node_wrapper') }))

    expect(harnessed.document().nodes[nodeId('node_wrapper')]?.children).toEqual([id('a')])
  })

  it('rejects a selection that does not share a parent', () => {
    const harnessed = harness({ document: doc(tree({ root: ['a', 'b'], a: ['a1'] })) })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(wrapInContainer({ ids: [id('b'), id('a1')], blockId: CONTAINER })),
      ),
    ).toBe(COMMAND_CODES.mixedParents)
  })

  it('rejects an empty selection', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(wrapInContainer({ ids: [], blockId: CONTAINER })),
      ),
    ).toBe(COMMAND_CODES.emptySelection)
  })

  it('rejects the root, which has no parent to wrap inside', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(wrapInContainer({ ids: [id('root')], blockId: CONTAINER })),
      ),
    ).toBe(COMMAND_CODES.rootProtected)
  })

  it('rejects a container block that declares no slot', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(wrapInContainer({ ids: [id('a')], blockId: fixtureBlockId('leaf') })),
      ),
    ).toBe(COMMAND_CODES.unknownSlot)
  })

  it('rejects a container whose slot will not take the selection', () => {
    const document = doc([
      node({ id: id('root'), slot: 'root', children: [id('a')] }),
      node({ id: id('a'), blockId: fixtureBlockId('leaf'), parentId: id('root') }),
    ])
    const harnessed = harness({ document })

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(
          wrapInContainer({
            ids: [id('a')],
            blockId: fixtureBlockId('section'),
            slot: 'children',
          }),
        ),
      ),
    ).toBe(COMMAND_CODES.slotRejectsBlock)
  })
})
