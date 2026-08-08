import { doc, fixtureBlockId, node, nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { capturePatches, codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { setProp } from './set-prop'

const cardDocument = (): ReturnType<typeof doc> =>
  doc([
    node({ id: id('root'), slot: 'root', children: [id('a')] }),
    node({
      id: id('a'),
      blockId: fixtureBlockId('card'),
      parentId: id('root'),
      props: { columns: 1, title: '' },
    }),
  ])

describe('setProp', () => {
  it('writes the value at the path', () => {
    const harnessed = harness({ document: cardDocument() })

    harnessed.store.getState().dispatch(setProp({ nodeId: id('a'), path: 'title', value: 'Ship' }))

    expect(harnessed.document().nodes[id('a')]?.props).toEqual({ columns: 1, title: 'Ship' })
  })

  it('produces a minimal patch for a prop change', () => {
    const harnessed = harness({ document: cardDocument() })

    expect(
      capturePatches(harnessed, setProp({ nodeId: id('a'), path: 'title', value: 'x' })),
    ).toEqual([{ op: 'replace', path: ['nodes', id('a'), 'props', 'title'], value: 'x' }])
  })

  it('creates the intermediate container of a nested path', () => {
    const harnessed = harness()

    harnessed.store
      .getState()
      .dispatch(setProp({ nodeId: id('a'), path: 'padding.top', value: 16 }))

    expect(harnessed.document().nodes[id('a')]?.props).toEqual({ padding: { top: 16 } })
  })

  it('labels itself for the undo tooltip', () => {
    expect(setProp({ nodeId: id('a'), path: 'backgroundColor', value: 'x' }).label).toBe(
      'Set Background color',
    )
  })

  it('coalesces per node and path', () => {
    expect(setProp({ nodeId: id('a'), path: 'title', value: 'x' }).coalesceKey).toBe(
      `set-prop:${id('a')}:title`,
    )
  })

  it('rejects a value the block schema refuses', () => {
    const harnessed = harness({ document: cardDocument() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(setProp({ nodeId: id('a'), path: 'columns', value: 99 })),
      ),
    ).toBe(COMMAND_CODES.invalidProps)
    expect(harnessed.document().nodes[id('a')]?.props['columns']).toBe(1)
  })

  it('reports a node that is not there', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(setProp({ nodeId: nodeId('node_absent'), path: 'title', value: 'x' })),
      ),
    ).toBe('NODE_NOT_FOUND')
  })
})
