import { beforeEach, describe, expect, it } from 'vitest'

import { nodeId } from '../ids/ids'
import { doc, resetFactories, tree, treeId } from '../test/factories'

import {
  ancestors,
  descendants,
  documentOrderIndex,
  isDescendant,
  nodeIds,
  reachableIds,
  walk,
} from './traverse'

const shape = { root: ['a', 'b'], a: ['c', 'd'], b: ['e'], c: [], d: [], e: [] }

const document = () => doc(tree(shape), { rootId: treeId('root') })

beforeEach(() => {
  resetFactories()
})

describe('walk', () => {
  it('visits depth-first in document order', () => {
    expect([...walk(document())].map((entry) => entry.name)).toEqual([
      'root',
      'a',
      'c',
      'd',
      'b',
      'e',
    ])
  })

  it('starts anywhere', () => {
    expect([...walk(document(), treeId('a'))].map((entry) => entry.name)).toEqual(['a', 'c', 'd'])
  })

  it('survives a child reference that points at nothing', () => {
    const broken = tree(shape).map((entry) =>
      entry.id === treeId('b') ? { ...entry, children: [nodeId('node_gone')] } : entry,
    )

    expect([...walk(doc(broken, { rootId: treeId('root') }))]).toHaveLength(5)
  })

  it('terminates on a cycle instead of hanging', () => {
    const cyclic = tree(shape).map((entry) =>
      entry.id === treeId('e') ? { ...entry, children: [treeId('root')] } : entry,
    )

    expect([...walk(doc(cyclic, { rootId: treeId('root') }))]).toHaveLength(6)
  })
})

describe('descendants and ancestors', () => {
  it('lists everything below a node, excluding it', () => {
    expect(descendants(document(), treeId('a')).map((entry) => entry.name)).toEqual(['c', 'd'])
  })

  it('lists ancestors nearest first', () => {
    expect(ancestors(document(), treeId('c')).map((entry) => entry.name)).toEqual(['a', 'root'])
  })

  it('gives the root no ancestors', () => {
    expect(ancestors(document(), treeId('root'))).toEqual([])
  })

  it('stops rather than looping when parents form a cycle', () => {
    const cyclic = tree(shape).map((entry) =>
      entry.id === treeId('root') ? { ...entry, parentId: treeId('c') } : entry,
    )

    expect(ancestors(doc(cyclic, { rootId: treeId('root') }), treeId('c'))).toHaveLength(2)
  })
})

describe('isDescendant', () => {
  it('is true down the tree and false up it', () => {
    expect(isDescendant(document(), treeId('c'), treeId('root'))).toBe(true)
    expect(isDescendant(document(), treeId('root'), treeId('c'))).toBe(false)
  })

  it('is false for a node against itself, so a no-op move is not rejected as a cycle', () => {
    expect(isDescendant(document(), treeId('a'), treeId('a'))).toBe(false)
  })

  it('is false across branches', () => {
    expect(isDescendant(document(), treeId('e'), treeId('a'))).toBe(false)
  })
})

describe('documentOrderIndex', () => {
  it('numbers nodes in the order the walk visits them', () => {
    expect(documentOrderIndex(document(), treeId('root'))).toBe(0)
    expect(documentOrderIndex(document(), treeId('b'))).toBe(4)
  })

  it('reports -1 for a node that is not reachable', () => {
    expect(documentOrderIndex(document(), nodeId('node_lost'))).toBe(-1)
  })
})

describe('the id helpers', () => {
  it('lists every key in nodes', () => {
    expect(nodeIds(document())).toHaveLength(6)
  })

  it('lists only what the root reaches', () => {
    const nodes = [...tree(shape)]
    const withOrphan = doc([...nodes], { rootId: treeId('a') })

    expect(reachableIds(withOrphan).size).toBe(3)
  })
})
