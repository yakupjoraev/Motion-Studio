import {
  type BlockRegistry,
  type MotionDocument,
  blockId,
  doc,
  fakeRegistry,
  fixtureBlockId,
  node,
  tree,
} from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { id } from '../test/harness'

import { resolveInsertTarget } from './resolve-insert-target'

const slot = (
  name: string,
  overrides: { accepts?: readonly ReturnType<typeof blockId>[] | '*'; maxChildren?: number | null },
): {
  name: string
  label: string
  accepts: readonly ReturnType<typeof blockId>[] | '*'
  minChildren: number
  maxChildren: number | null
} => ({
  name,
  label: name,
  accepts: overrides.accepts ?? '*',
  minChildren: 0,
  maxChildren: overrides.maxChildren ?? null,
})

const registry: BlockRegistry = fakeRegistry({
  container: { slots: [slot('children', {})] },
  // Takes one card and nothing else, which is what makes the walk up the ancestors observable.
  section: { slots: [slot('children', { accepts: [fixtureBlockId('card')], maxChildren: 1 })] },
  card: { slots: [] },
})

const CARD = fixtureBlockId('card')

const nested = (): MotionDocument =>
  doc([
    node({ id: id('root'), slot: 'root', children: [id('section')] }),
    node({
      id: id('section'),
      blockId: fixtureBlockId('section'),
      parentId: id('root'),
      slot: 'children',
      children: [id('card')],
    }),
    node({ id: id('card'), blockId: CARD, parentId: id('section'), slot: 'children' }),
  ])

const resolve = (
  document: MotionDocument,
  args: {
    selectionIds?: readonly ReturnType<typeof id>[]
    isolationId?: ReturnType<typeof id> | null
  },
): ReturnType<typeof resolveInsertTarget> =>
  resolveInsertTarget({
    document,
    registry,
    blockId: CARD,
    selectionIds: args.selectionIds ?? [],
    isolationId: args.isolationId ?? null,
  })

describe('resolveInsertTarget', () => {
  it('lands in the root at the end when nothing is selected', () => {
    const document = doc(tree({ root: ['a', 'b'] }))

    expect(resolve(document, {})).toEqual({ parentId: id('root'), slot: 'children', index: 2 })
  })

  it('lands after the selection, in the selection`s own slot', () => {
    const document = doc(tree({ root: ['a', 'b', 'c'] }))

    expect(resolve(document, { selectionIds: [id('b')] })).toEqual({
      parentId: id('root'),
      slot: 'children',
      index: 2,
    })
  })

  it('prefers the isolated container over the selection', () => {
    const document = doc(tree({ root: ['a', 'b'], a: ['a1'] }))

    expect(resolve(document, { selectionIds: [id('b')], isolationId: id('a') })).toEqual({
      parentId: id('a'),
      slot: 'children',
      index: 1,
    })
  })

  it('walks up when the selected block has no slot of its own', () => {
    const document = doc([
      node({ id: id('root'), slot: 'root', children: [id('card')] }),
      node({ id: id('card'), blockId: CARD, parentId: id('root'), slot: 'children' }),
    ])

    expect(resolve(document, { selectionIds: [id('card')] })).toEqual({
      parentId: id('root'),
      slot: 'children',
      index: 1,
    })
  })

  it('walks past a full slot and lands after the branch it came from', () => {
    expect(resolve(nested(), { selectionIds: [id('card')] })).toEqual({
      parentId: id('root'),
      slot: 'children',
      index: 1,
    })
  })

  it('walks past a locked parent', () => {
    const document = doc(
      tree({ root: ['a'], a: ['a1'] }).map((entry) =>
        entry.id === id('a') ? { ...entry, locked: true } : entry,
      ),
    )

    expect(resolve(document, { selectionIds: [id('a1')] })).toEqual({
      parentId: id('root'),
      slot: 'children',
      index: 1,
    })
  })

  it('rejects a block the registry does not have', () => {
    const result = resolve(doc(tree({ root: [] })), {})

    expect(
      resolveInsertTarget({
        document: doc(tree({ root: [] })),
        registry,
        blockId: blockId('nothing-like-this'),
        selectionIds: [],
        isolationId: null,
      }),
    ).toEqual({ rejected: 'nothing-like-this is not a block in this registry' })
    expect(result).toEqual({ parentId: id('root'), slot: 'children', index: 0 })
  })

  it('rejects when no ancestor accepts the block', () => {
    const document = doc([node({ id: id('root'), blockId: CARD, slot: 'root', children: [] })])

    expect(resolve(document, {})).toEqual({ rejected: 'Nothing here accepts card' })
  })

  it('stops the walk at a parent the document has lost', () => {
    const document = doc([
      node({ id: id('root'), blockId: CARD, slot: 'root', children: [] }),
      node({ id: id('stray'), blockId: CARD, parentId: id('gone'), slot: 'children' }),
    ])

    expect(resolve(document, { selectionIds: [id('stray')] })).toEqual({
      rejected: 'Nothing here accepts card',
    })
  })

  it('ignores an isolation id and a selection the document does not have', () => {
    const document = doc(tree({ root: ['a'] }))

    expect(resolve(document, { selectionIds: [id('gone')], isolationId: id('gone') })).toEqual({
      parentId: id('root'),
      slot: 'children',
      index: 1,
    })
  })
})
