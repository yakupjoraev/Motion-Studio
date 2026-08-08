import {
  type BlockRegistry,
  type MotionDocument,
  doc,
  fakeRegistry,
  fixtureBlockId,
  tree,
} from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { id } from '../test/harness'

import type { SerializedSubtree } from './clipboard.types'
import { resolvePasteTarget } from './paste-target'
import { serializeSubtree } from './serialize-subtree'

const registry: BlockRegistry = fakeRegistry({
  container: {
    slots: [
      { name: 'children', label: 'Children', accepts: '*', minChildren: 0, maxChildren: null },
    ],
  },
})

const source = (): MotionDocument => doc(tree({ root: ['a', 'b', 'c'] }))

const copied = (): SerializedSubtree => serializeSubtree(source(), [id('b')])

const resolve = (
  document: MotionDocument,
  inPlace: boolean,
  subtree: SerializedSubtree = copied(),
): ReturnType<typeof resolvePasteTarget> =>
  resolvePasteTarget({
    document,
    registry,
    subtree,
    selectionIds: [],
    isolationId: null,
    inPlace,
  })

describe('resolvePasteTarget', () => {
  it('puts a paste in place back at the index it came from', () => {
    expect(resolve(source(), true)).toEqual({
      parentId: id('root'),
      slot: 'children',
      index: 1,
    })
  })

  it('falls back to the normal resolution when the original parent is gone', () => {
    const document = doc(tree({ root: ['x'], x: [] }))
    const orphaned = serializeSubtree(doc(tree({ other: ['b'] })), [id('b')])

    expect(resolve(document, true, orphaned)).toEqual({
      parentId: id('root'),
      slot: 'children',
      index: 1,
    })
  })

  it('falls back when the original parent is locked', () => {
    const document = doc(
      tree({ root: ['a', 'b', 'c'] }).map((entry) =>
        entry.id === id('root') ? { ...entry, locked: true } : entry,
      ),
    )

    expect(resolve(document, true)).toEqual({ rejected: 'Nothing here accepts container' })
  })

  it('ignores the origin when the paste is not in place', () => {
    expect(resolve(source(), false)).toEqual({
      parentId: id('root'),
      slot: 'children',
      index: 3,
    })
  })

  it('clamps an origin index the parent has outgrown', () => {
    const shrunk = doc(tree({ root: ['a'] }))
    const fromTheEnd = serializeSubtree(source(), [id('c')])

    expect(resolve(shrunk, true, fromTheEnd)).toEqual({
      parentId: id('root'),
      slot: 'children',
      index: 1,
    })
  })

  it('falls back when the original slot no longer takes the block', () => {
    const narrow: BlockRegistry = fakeRegistry({
      container: {
        slots: [
          {
            name: 'children',
            label: 'Children',
            accepts: [fixtureBlockId('card')],
            minChildren: 0,
            maxChildren: null,
          },
        ],
      },
      card: { slots: [] },
    })

    expect(
      resolvePasteTarget({
        document: source(),
        registry: narrow,
        subtree: copied(),
        selectionIds: [],
        isolationId: null,
        inPlace: true,
      }),
    ).toEqual({ rejected: 'Nothing here accepts container' })
  })

  it('falls back when the original slot is full', () => {
    const full: BlockRegistry = fakeRegistry({
      container: {
        slots: [
          { name: 'children', label: 'Children', accepts: '*', minChildren: 0, maxChildren: 3 },
        ],
      },
    })

    expect(
      resolvePasteTarget({
        document: source(),
        registry: full,
        subtree: copied(),
        selectionIds: [],
        isolationId: null,
        inPlace: true,
      }),
    ).toEqual({ rejected: 'Nothing here accepts container' })
  })

  it('falls back when an in-place payload has no roots at all', () => {
    const empty: SerializedSubtree = {
      version: 1,
      rootIds: [],
      nodes: {},
      assets: {},
      origins: {},
    }

    expect(resolve(source(), true, empty)).toEqual({ rejected: 'The clipboard holds no blocks' })
  })

  it('rejects a payload with no roots', () => {
    const empty: SerializedSubtree = {
      version: 1,
      rootIds: [],
      nodes: {},
      assets: {},
      origins: {},
    }

    expect(resolve(source(), false, empty)).toEqual({ rejected: 'The clipboard holds no blocks' })
  })
})
