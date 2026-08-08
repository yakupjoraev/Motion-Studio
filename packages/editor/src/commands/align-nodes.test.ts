import { doc, node, tree } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { capturePatches, codeOf, harness, id } from '../test/harness'

import { alignNodes, alignmentProp } from './align-nodes'
import { COMMAND_CODES } from './guards'

const column = (): ReturnType<typeof doc> =>
  doc([
    node({
      id: id('root'),
      slot: 'root',
      children: [id('a'), id('b')],
      props: { direction: 'column' },
    }),
    node({ id: id('a'), parentId: id('root') }),
    node({ id: id('b'), parentId: id('root') }),
  ])

describe('alignNodes', () => {
  it('writes the main-axis prop of the shared parent for a row container', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(alignNodes({ ids: [id('a'), id('b')], edge: 'left' }))

    expect(harnessed.document().nodes[id('root')]?.props).toEqual({ justify: 'start' })
  })

  it('writes the cross-axis prop for an edge across the container direction', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(alignNodes({ ids: [id('a')], edge: 'middle' }))

    expect(harnessed.document().nodes[id('root')]?.props).toEqual({ align: 'center' })
  })

  it('swaps the axes for a column container', () => {
    const harnessed = harness({ document: column() })

    harnessed.store.getState().dispatch(alignNodes({ ids: [id('a'), id('b')], edge: 'right' }))

    expect(harnessed.document().nodes[id('root')]?.props).toMatchObject({ align: 'end' })
  })

  it('maps every edge to an axis and a value', () => {
    const row = node({ props: {} })
    const stack = node({ props: { direction: 'column' } })

    expect([
      alignmentProp(row, 'left'),
      alignmentProp(row, 'top'),
      alignmentProp(stack, 'left'),
      alignmentProp(stack, 'bottom'),
    ]).toEqual(['justify', 'align', 'align', 'justify'])
  })

  it('writes nothing when the container is already aligned that way', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(alignNodes({ ids: [id('a')], edge: 'center' }))

    expect(capturePatches(harnessed, alignNodes({ ids: [id('a')], edge: 'center' }))).toEqual([])
  })

  it('rejects a selection that does not share a parent', () => {
    const harnessed = harness({ document: doc(tree({ root: ['a', 'b'], a: ['a1'] })) })

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(alignNodes({ ids: [id('b'), id('a1')], edge: 'left' })),
      ),
    ).toBe(COMMAND_CODES.mixedParents)
  })

  it('rejects an empty selection and the root', () => {
    const harnessed = harness()

    expect(
      codeOf(() => harnessed.store.getState().dispatch(alignNodes({ ids: [], edge: 'left' }))),
    ).toBe(COMMAND_CODES.emptySelection)
    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(alignNodes({ ids: [id('root')], edge: 'left' })),
      ),
    ).toBe(COMMAND_CODES.rootProtected)
  })
})
