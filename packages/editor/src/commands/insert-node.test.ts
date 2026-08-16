import {
  type MotionSpec,
  doc,
  fakeRegistry,
  fixtureBlockId,
  node,
  nodeId,
  validateDocument,
} from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { codeOf, commandRegistry, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { insertNode } from './insert-node'

const CARD = fixtureBlockId('card')
const SECTION = fixtureBlockId('section')

const sectionDocument = (children: number): ReturnType<typeof doc> => {
  const kids = Array.from({ length: children }, (_, index) =>
    node({ id: nodeId(`node_kid${index}`), blockId: CARD, parentId: id('root'), slot: 'children' }),
  )

  return doc([
    node({
      id: id('root'),
      blockId: SECTION,
      slot: 'root',
      children: kids.map((kid) => kid.id),
    }),
    ...kids,
  ])
}

describe('insertNode', () => {
  it('inserts at the index with the block defaults applied', () => {
    const harnessed = harness()

    harnessed.store
      .getState()
      .dispatch(insertNode({ blockId: CARD, parentId: id('root'), index: 1, slot: 'children' }))

    const document = harnessed.document()

    expect(document.nodes[id('root')]?.children).toEqual([
      id('a'),
      nodeId('node_1'),
      id('b'),
      id('c'),
      id('d'),
    ])
    expect(document.nodes[nodeId('node_1')]?.props).toEqual({ columns: 1, title: '' })
    expect(document.nodes[nodeId('node_1')]?.name).toBe('card')
    expect(validateDocument(document)).toEqual({ ok: true, value: undefined })
  })

  it('merges the caller overrides over the defaults', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(
      insertNode({
        blockId: CARD,
        parentId: id('root'),
        index: 0,
        slot: 'children',
        props: { title: 'Pricing' },
        name: 'Pricing card',
      }),
    )

    expect(harnessed.document().nodes[nodeId('node_1')]?.props).toEqual({
      columns: 1,
      title: 'Pricing',
    })
    expect(harnessed.document().nodes[nodeId('node_1')]?.name).toBe('Pricing card')
  })

  it('clamps an index past the end', () => {
    const harnessed = harness()

    harnessed.store
      .getState()
      .dispatch(insertNode({ blockId: CARD, parentId: id('root'), index: 99, slot: 'children' }))

    expect(harnessed.document().nodes[id('root')]?.children.at(-1)).toBe(nodeId('node_1'))
  })

  it('takes the id the caller chose, and rejects one already in use', () => {
    const harnessed = harness()
    const chosen = nodeId('node_chosen')

    harnessed.store
      .getState()
      .dispatch(
        insertNode({ blockId: CARD, parentId: id('root'), index: 0, slot: 'children', id: chosen }),
      )

    expect(harnessed.document().nodes[chosen]?.blockId).toBe(CARD)
    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(
          insertNode({
            blockId: CARD,
            parentId: id('root'),
            index: 0,
            slot: 'children',
            id: chosen,
          }),
        ),
      ),
    ).toBe(COMMAND_CODES.nodeIdTaken)
  })

  it('rejects a missing parent', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(
          insertNode({
            blockId: CARD,
            parentId: nodeId('node_absent'),
            index: 0,
            slot: 'children',
          }),
        ),
      ),
    ).toBe('NODE_NOT_FOUND')
  })

  it('rejects a locked parent', () => {
    const document = doc([node({ id: id('root'), slot: 'root', locked: true, children: [] })])
    const harnessed = harness({ document })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(
            insertNode({ blockId: CARD, parentId: id('root'), index: 0, slot: 'children' }),
          ),
      ),
    ).toBe(COMMAND_CODES.lockedNode)
  })

  it('rejects a slot the parent block does not declare', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(insertNode({ blockId: CARD, parentId: id('root'), index: 0, slot: 'media' })),
      ),
    ).toBe(COMMAND_CODES.unknownSlot)
  })

  it('rejects a block the slot does not accept', () => {
    const harnessed = harness({ document: sectionDocument(0), registry: commandRegistry() })

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(
          insertNode({
            blockId: fixtureBlockId('leaf'),
            parentId: id('root'),
            index: 0,
            slot: 'children',
          }),
        ),
      ),
    ).toBe(COMMAND_CODES.slotRejectsBlock)
  })

  it('asks a predicate slot about the candidate block', () => {
    const registry = fakeRegistry({
      container: {},
      gate: {
        slots: [
          {
            name: 'children',
            label: 'Children',
            accepts: (definition) => definition.category === 'hero',
            minChildren: 0,
            maxChildren: null,
          },
        ],
      },
    })
    const document = doc([
      node({ id: id('root'), blockId: fixtureBlockId('gate'), slot: 'root', children: [] }),
    ])
    const harnessed = harness({ registry, document })

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(
          insertNode({
            blockId: fixtureBlockId('container'),
            parentId: id('root'),
            index: 0,
            slot: 'children',
          }),
        ),
      ),
    ).toBe(COMMAND_CODES.slotRejectsBlock)
  })

  it('rejects a slot that is already full', () => {
    const harnessed = harness({ document: sectionDocument(2) })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(
            insertNode({ blockId: CARD, parentId: id('root'), index: 0, slot: 'children' }),
          ),
      ),
    ).toBe(COMMAND_CODES.slotFull)
  })

  // ADR-154: the block's default entrance is written into the node, so the document says what it
  // animates and `clearMotion` can take it off again.
  it('materialises the block default motion into the node', () => {
    const entrance: MotionSpec = {
      presetId: 'fade-up',
      channel: 'entrance',
      trigger: { kind: 'inView', amount: 0.3, once: true, margin: '0px' },
      params: { distance: 16 },
    }
    const harnessed = harness({
      registry: fakeRegistry({ container: {}, card: { defaultMotion: { entrance } } }),
    })

    harnessed.store
      .getState()
      .dispatch(insertNode({ blockId: CARD, parentId: id('root'), index: 0, slot: 'children' }))

    const inserted = harnessed.document().nodes[nodeId('node_1')]

    expect(inserted?.motion).toEqual({ entrance })
    // A copy, not the registry's object: editing one node's motion cannot reach the block.
    expect(inserted?.motion.entrance).not.toBe(entrance)
  })

  it('rejects props the block schema does not accept', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(
          insertNode({
            blockId: CARD,
            parentId: id('root'),
            index: 0,
            slot: 'children',
            props: { columns: 99 },
          }),
        ),
      ),
    ).toBe(COMMAND_CODES.invalidProps)
  })
})
