import { doc, node } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { capturePatches, codeOf, harness, id } from '../test/harness'

import { distributeNodes } from './distribute-nodes'
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

describe('distributeNodes', () => {
  it('spaces the container’s children along its own axis', () => {
    const harnessed = harness()

    harnessed.store
      .getState()
      .dispatch(distributeNodes({ ids: [id('a'), id('b')], axis: 'horizontal' }))

    expect(harnessed.document().nodes[id('root')]?.props).toEqual({ justify: 'between' })
  })

  it('distributes a column container vertically', () => {
    const harnessed = harness({ document: column() })

    harnessed.store
      .getState()
      .dispatch(distributeNodes({ ids: [id('a'), id('b')], axis: 'vertical' }))

    expect(harnessed.document().nodes[id('root')]?.props).toMatchObject({ justify: 'between' })
  })

  it('rejects the cross axis rather than approximating it', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(distributeNodes({ ids: [id('a'), id('b')], axis: 'vertical' })),
      ),
    ).toBe(COMMAND_CODES.crossAxisDistribute)
  })

  it('writes nothing when the container already distributes', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(distributeNodes({ ids: [id('a')], axis: 'horizontal' }))

    expect(
      capturePatches(harnessed, distributeNodes({ ids: [id('a')], axis: 'horizontal' })),
    ).toEqual([])
  })

  it('rejects a selection that does not share a parent', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(distributeNodes({ ids: [], axis: 'horizontal' })),
      ),
    ).toBe(COMMAND_CODES.emptySelection)
  })

  it('reads as an undo label', () => {
    expect(distributeNodes({ ids: [], axis: 'horizontal' }).label).toBe('Distribute horizontally')
  })
})
