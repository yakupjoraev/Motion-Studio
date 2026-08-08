import { describe, expect, it } from 'vitest'

import { codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { reorderNode } from './reorder-node'

describe('reorderNode', () => {
  it('moves a sibling to the index it would occupy after being lifted out', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(reorderNode({ nodeId: id('a'), index: 2 }))

    expect(harnessed.document().nodes[id('root')]?.children).toEqual([
      id('b'),
      id('c'),
      id('a'),
      id('d'),
    ])
  })

  it('clamps an index past the last sibling', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(reorderNode({ nodeId: id('b'), index: 99 }))

    expect(harnessed.document().nodes[id('root')]?.children.at(-1)).toBe(id('b'))
  })

  it('writes nothing when the node is already at that index', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(reorderNode({ nodeId: id('a'), index: 0 }))

    expect(harnessed.store.getState().version).toBe(0)
  })

  it('refuses the root, which has no siblings', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(reorderNode({ nodeId: id('root'), index: 0 })),
      ),
    ).toBe(COMMAND_CODES.rootProtected)
  })
})
