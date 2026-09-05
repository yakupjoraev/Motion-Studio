import { fakeRegistry, fixtureBlockId, nodeId, validateDocument } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { insertBlock } from './insert-block'

const SHELL = fixtureBlockId('shell')

describe('insertBlock', () => {
  it('materialises the block and the default children of its slots', () => {
    const harnessed = harness()

    harnessed.store
      .getState()
      .dispatch(insertBlock({ blockId: SHELL, parentId: id('root'), index: 0, slot: 'children' }))

    const document = harnessed.document()
    const shell = document.nodes[nodeId('node_1')]

    expect(shell?.children).toEqual([nodeId('node_2'), nodeId('node_3')])
    expect(document.nodes[nodeId('node_2')]?.blockId).toBe(fixtureBlockId('card'))
    expect(document.nodes[nodeId('node_2')]?.slot).toBe('children')
    expect(validateDocument(document)).toEqual({ ok: true, value: undefined })
  })

  /**
   * ADR-364: a block inserted in a Russian session lands with Russian text, and the slots' default
   * children land with theirs — a hero whose card says «Заголовок» while the hero above it says
   * something else would be worse than no translation at all.
   */
  it('writes the copy the caller passes into the block and its default children', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(
      insertBlock({
        blockId: SHELL,
        parentId: id('root'),
        index: 0,
        slot: 'children',
        copy: { card: { title: 'Заголовок' } },
      }),
    )

    const document = harnessed.document()

    expect(document.nodes[nodeId('node_2')]?.props['title']).toBe('Заголовок')
    expect(document.nodes[nodeId('node_3')]?.props['title']).toBe('Заголовок')
    // The document holds the strings, not the language: nothing about a locale is written down.
    expect(validateDocument(document)).toEqual({ ok: true, value: undefined })
  })

  it('leaves the block on its own defaults when the caller passes no copy for it', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(
      insertBlock({
        blockId: SHELL,
        parentId: id('root'),
        index: 0,
        slot: 'children',
        copy: { 'not-this-block': { title: 'Заголовок' } },
      }),
    )

    expect(harnessed.document().nodes[nodeId('node_2')]?.props['title']).toBe('')
  })

  it('inserts nothing extra for a block whose slots declare no defaults', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(
      insertBlock({
        blockId: fixtureBlockId('card'),
        parentId: id('root'),
        index: 0,
        slot: 'children',
      }),
    )

    expect(Object.keys(harnessed.document().nodes)).toHaveLength(6)
  })

  it('rejects a default-children chain that reaches its own block', () => {
    const registry = fakeRegistry({
      container: {},
      loop: {
        slots: [
          {
            name: 'children',
            label: 'Children',
            accepts: '*',
            minChildren: 0,
            maxChildren: null,
            defaultChildren: [fixtureBlockId('loop')],
          },
        ],
      },
    })
    const harnessed = harness({ registry })

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(
          insertBlock({
            blockId: fixtureBlockId('loop'),
            parentId: id('root'),
            index: 0,
            slot: 'children',
          }),
        ),
      ),
    ).toBe(COMMAND_CODES.recursiveDefaultChildren)
  })
})
