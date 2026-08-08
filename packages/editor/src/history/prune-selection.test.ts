import { doc, tree, treeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { pruneSelection } from './prune-selection'

const id = treeId

describe('pruneSelection', () => {
  it('clears every field that names a node the document lost', () => {
    const before = {
      ids: [id('a1'), id('b1')],
      anchorId: id('a1'),
      editingId: id('a2'),
      hoverId: id('b1'),
      isolationId: id('a'),
    }

    const pruned = pruneSelection(
      before,
      doc(tree({ root: ['b'], b: ['b1'] }), { rootId: id('root') }),
    )

    expect(pruned).toEqual({
      ids: [id('b1')],
      anchorId: null,
      editingId: null,
      hoverId: id('b1'),
      isolationId: null,
    })
  })
})
