import {
  doc,
  effectId,
  fixtureBlockId,
  node,
  nodeId,
  tree,
  validateDocument,
} from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { codeOf, harness, id } from '../test/harness'

import { duplicateNodes } from './duplicate-nodes'
import { COMMAND_CODES } from './guards'

const referencing = (): ReturnType<typeof doc> =>
  doc(
    tree({ root: ['a', 'b'], a: ['a1'] }).map((entry) =>
      entry.id === id('a') ? { ...entry, props: { layoutId: 'hero', target: id('a1') } } : entry,
    ),
  )

describe('duplicateNodes', () => {
  it('puts the copy directly after the original', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(duplicateNodes({ ids: [id('b')] }))

    expect(harnessed.document().nodes[id('root')]?.children).toEqual([
      id('a'),
      id('b'),
      nodeId('node_1'),
      id('c'),
      id('d'),
    ])
    expect(validateDocument(harnessed.document())).toEqual({ ok: true, value: undefined })
  })

  it('names the copy, then numbers the next one', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(duplicateNodes({ ids: [id('b')] }))
    harnessed.store.getState().dispatch(duplicateNodes({ ids: [id('b')] }))

    const names = harnessed
      .document()
      .nodes[id('root')]?.children.map((child) => harnessed.document().nodes[child]?.name)

    expect(names).toEqual(['a', 'b', 'b copy 2', 'b copy', 'c', 'd'])
  })

  it('numbers past a name that is already taken twice', () => {
    const harnessed = harness()
    const state = harnessed.store.getState()

    state.dispatch(duplicateNodes({ ids: [id('b')] }))
    state.dispatch(duplicateNodes({ ids: [id('b')] }))
    state.dispatch(duplicateNodes({ ids: [id('b')] }))

    const names = harnessed
      .document()
      .nodes[id('root')]?.children.map((child) => harnessed.document().nodes[child]?.name)

    expect(names).toContain('b copy 3')
  })

  it('remaps ids inside an array prop', () => {
    const document = doc(
      tree({ root: ['a'], a: ['a1', 'a2'] }).map((entry) =>
        entry.id === id('a') ? { ...entry, props: { order: [id('a1'), id('a2')] } } : entry,
      ),
    )
    const harnessed = harness({ document })

    harnessed.store.getState().dispatch(duplicateNodes({ ids: [id('a')] }))

    expect(harnessed.document().nodes[nodeId('node_1')]?.props['order']).toEqual([
      nodeId('node_2'),
      nodeId('node_3'),
    ])
  })

  it('remaps every id the copy carries, and shares none with the original', () => {
    const harnessed = harness({ document: referencing() })

    harnessed.store.getState().dispatch(duplicateNodes({ ids: [id('a')] }))

    const document = harnessed.document()
    const copy = document.nodes[nodeId('node_1')]
    const copiedChild = copy?.children[0]

    expect(copiedChild).toBe(nodeId('node_3'))
    expect(copy?.props['target']).toBe(copiedChild)
    expect(copy?.props['layoutId']).toBe('layout_2')
    expect(document.nodes[id('a')]?.props).toEqual({ layoutId: 'hero', target: id('a1') })
    expect(document.nodes[copiedChild ?? id('a')]?.parentId).toBe(nodeId('node_1'))
  })

  it('gives the copied effects their own instance ids', () => {
    const document = doc([
      node({ id: id('root'), slot: 'root', children: [id('a')] }),
      node({
        id: id('a'),
        parentId: id('root'),
        effects: [
          {
            id: 'fx_original',
            effectId: effectId('noise-overlay'),
            params: {},
            layer: 'behind',
            blendMode: 'normal',
            opacity: 1,
          },
        ],
      }),
    ])
    const harnessed = harness({ document })

    harnessed.store.getState().dispatch(duplicateNodes({ ids: [id('a')] }))

    expect(harnessed.document().nodes[nodeId('node_1')]?.effects[0]?.id).toBe('fx_2')
  })

  it('refuses to duplicate the root', () => {
    const harnessed = harness()

    expect(
      codeOf(() => harnessed.store.getState().dispatch(duplicateNodes({ ids: [id('root')] }))),
    ).toBe(COMMAND_CODES.rootProtected)
  })

  it('rejects a duplicate that would overfill the slot', () => {
    const document = doc([
      node({
        id: id('root'),
        blockId: fixtureBlockId('section'),
        slot: 'root',
        children: [id('a'), id('b')],
      }),
      node({ id: id('a'), blockId: fixtureBlockId('card'), parentId: id('root') }),
      node({ id: id('b'), blockId: fixtureBlockId('card'), parentId: id('root') }),
    ])
    const harnessed = harness({ document })

    expect(
      codeOf(() => harnessed.store.getState().dispatch(duplicateNodes({ ids: [id('a')] }))),
    ).toBe(COMMAND_CODES.slotFull)
  })
})
