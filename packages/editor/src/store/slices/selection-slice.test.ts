import { doc, resetFactories, tree, treeId } from '@motion-studio/schema'
import { beforeEach, describe, expect, it } from 'vitest'

import { removeNode } from '../../test/commands'
import { createTestStore } from '../../test/create-test-store'

import { normalizeSelection, pruneSelection } from './selection-slice'

/** `root` over two sections, each with two children, so ordering and ancestry are both visible. */
const shape = { root: ['a', 'b'], a: ['a1', 'a2'], b: ['b1'], a1: [], a2: [], b1: [] }
const id = treeId
const document = () => doc(tree(shape), { rootId: id('root') })
const store = () => createTestStore({ document: document() })

beforeEach(() => {
  resetFactories()
})

describe('select', () => {
  it('replaces by default and anchors on the last id named', () => {
    const editor = store()

    editor.getState().select([id('a1')])
    editor.getState().select([id('b1')])

    expect(editor.getState().selection.ids).toEqual([id('b1')])
    expect(editor.getState().selection.anchorId).toBe(id('b1'))
  })

  it('adds to the selection, in document order', () => {
    const editor = store()

    editor.getState().select([id('b1')])
    editor.getState().select([id('a1')], 'add')

    expect(editor.getState().selection.ids).toEqual([id('a1'), id('b1')])
  })

  it('toggles an id out of the selection and back in', () => {
    const editor = store()

    editor.getState().select([id('a1'), id('a2')])
    editor.getState().select([id('a1')], 'toggle')
    expect(editor.getState().selection.ids).toEqual([id('a2')])

    editor.getState().select([id('a1')], 'toggle')
    expect(editor.getState().selection.ids).toEqual([id('a1'), id('a2')])
  })

  it('takes the sibling range between the anchor and the target', () => {
    const editor = createTestStore({
      document: doc(tree({ root: ['a', 'b', 'c', 'd'], a: [], b: [], c: [], d: [] }), {
        rootId: id('root'),
      }),
    })

    editor.getState().select([id('b')])
    editor.getState().select([id('d')], 'range')

    expect(editor.getState().selection.ids).toEqual([id('b'), id('c'), id('d')])
    // The anchor stays where the range was measured from, so extending the range again works.
    expect(editor.getState().selection.anchorId).toBe(id('b'))
  })

  it('ranges backwards from the anchor as well', () => {
    const editor = createTestStore({
      document: doc(tree({ root: ['a', 'b', 'c'], a: [], b: [], c: [] }), { rootId: id('root') }),
    })

    editor.getState().select([id('c')])
    editor.getState().select([id('a')], 'range')

    expect(editor.getState().selection.ids).toEqual([id('a'), id('b'), id('c')])
  })

  it('falls back to replace when a range has no anchor', () => {
    const editor = store()

    editor.getState().select([id('a1')], 'range')

    expect(editor.getState().selection.ids).toEqual([id('a1')])
  })

  it('falls back to replace when the target is not a sibling of the anchor', () => {
    const editor = store()

    editor.getState().select([id('a1')])
    editor.getState().select([id('b1')], 'range')

    expect(editor.getState().selection.ids).toEqual([id('b1')])
  })

  it('drops a child when its parent is selected too', () => {
    const editor = store()

    editor.getState().select([id('a1'), id('a')])

    expect(editor.getState().selection.ids).toEqual([id('a')])
  })

  it('ignores an id the document does not contain', () => {
    const editor = store()

    editor.getState().select([id('nowhere')])

    expect(editor.getState().selection.ids).toEqual([])
    expect(editor.getState().selection.anchorId).toBeNull()
  })
})

describe('selectAll', () => {
  it('takes the root children when nothing is isolated', () => {
    const editor = store()

    editor.getState().selectAll()

    expect(editor.getState().selection.ids).toEqual([id('a'), id('b')])
  })

  it('takes the children of the isolated container', () => {
    const editor = store()

    editor.getState().enterNode(id('a'))
    editor.getState().selectAll()

    expect(editor.getState().selection.ids).toEqual([id('a1'), id('a2')])
  })
})

describe('isolation', () => {
  it('enters a container', () => {
    const editor = store()

    editor.getState().enterNode(id('a'))

    expect(editor.getState().selection.isolationId).toBe(id('a'))
  })

  it('does nothing when entering the root, which is where you already are', () => {
    const editor = store()

    editor.getState().enterNode(id('root'))

    expect(editor.getState().selection.isolationId).toBeNull()
  })

  it('does nothing when entering a node the document does not contain', () => {
    const editor = store()

    editor.getState().enterNode(id('nowhere'))

    expect(editor.getState().selection.isolationId).toBeNull()
  })

  it('steps back one level, and to the top level from a child of the root', () => {
    const editor = store()

    editor.getState().enterNode(id('a1'))
    editor.getState().exitNode()
    expect(editor.getState().selection.isolationId).toBe(id('a'))

    editor.getState().exitNode()
    expect(editor.getState().selection.isolationId).toBeNull()
  })

  it('is a no-op at the top level', () => {
    const editor = store()
    const before = editor.getState().selection

    editor.getState().exitNode()

    expect(editor.getState().selection).toBe(before)
  })
})

/**
 * Selection is pruned when a document is loaded, not after every command, so between a removal and
 * the next load these fields can name a node that is gone. None of them may crash or isolate a
 * container that does not exist.
 */
describe('after a node is removed under it', () => {
  it('selects nothing when the isolated container is gone', () => {
    const editor = store()

    editor.getState().enterNode(id('a'))
    editor.getState().dispatch(removeNode(id('a')))
    editor.getState().selectAll()

    expect(editor.getState().selection.ids).toEqual([])
  })

  it('steps out to the top level when the isolated container is gone', () => {
    const editor = store()

    editor.getState().enterNode(id('a'))
    editor.getState().dispatch(removeNode(id('a')))
    editor.getState().exitNode()

    expect(editor.getState().selection.isolationId).toBeNull()
  })

  it('falls back to replace when the anchor itself is gone', () => {
    const editor = store()

    editor.getState().select([id('a')])
    editor.getState().dispatch(removeNode(id('a')))
    editor.getState().select([id('b')], 'range')

    expect(editor.getState().selection.ids).toEqual([id('b')])
  })

  it('falls back to replace when the anchor has lost its parent', () => {
    const editor = store()

    editor.getState().select([id('a1')])
    editor.getState().dispatch(removeNode(id('a')))
    editor.getState().select([id('b')], 'range')

    expect(editor.getState().selection.ids).toEqual([id('b')])
  })
})

describe('clearSelection, hover and editing', () => {
  it('keeps the anchor when asked to select nothing', () => {
    const editor = store()

    editor.getState().select([id('a1')])
    editor.getState().select([])

    expect(editor.getState().selection.ids).toEqual([])
    expect(editor.getState().selection.anchorId).toBe(id('a1'))
  })

  it('clears ids, anchor and the editing target, and leaves hover alone', () => {
    const editor = store()

    editor.getState().select([id('a1')])
    editor.getState().setEditing(id('a1'))
    editor.getState().setHover(id('b1'))
    editor.getState().clearSelection()

    const { selection } = editor.getState()

    expect(selection.ids).toEqual([])
    expect(selection.anchorId).toBeNull()
    expect(selection.editingId).toBeNull()
    expect(selection.hoverId).toBe(id('b1'))
  })
})

describe('normalizeSelection', () => {
  it('drops duplicates and returns document order', () => {
    expect(normalizeSelection(document(), [id('b1'), id('a1'), id('b1')])).toEqual([
      id('a1'),
      id('b1'),
    ])
  })

  it('drops a node with any ancestor in the set, not just the parent', () => {
    expect(normalizeSelection(document(), [id('a1'), id('root')])).toEqual([id('root')])
  })
})

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
