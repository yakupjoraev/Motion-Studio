import { type EffectInstance, doc, effectId, node } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { capturePatches, codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { reorderEffect } from './reorder-effect'

const instance = (name: string): EffectInstance => ({
  id: name,
  effectId: effectId('noise-overlay'),
  params: {},
  layer: 'behind',
  blendMode: 'normal',
  opacity: 1,
})

const stacked = (): ReturnType<typeof doc> =>
  doc([
    node({ id: id('root'), slot: 'root', children: [id('a')] }),
    node({
      id: id('a'),
      parentId: id('root'),
      effects: [instance('fx_1'), instance('fx_2'), instance('fx_3')],
    }),
  ])

const order = (harnessed: ReturnType<typeof harness>): readonly string[] =>
  harnessed.document().nodes[id('a')]?.effects.map((effect) => effect.id) ?? []

describe('reorderEffect', () => {
  it('moves a layer down the stack', () => {
    const harnessed = harness({ document: stacked() })

    harnessed.store
      .getState()
      .dispatch(reorderEffect({ nodeId: id('a'), instanceId: 'fx_1', index: 2 }))

    expect(order(harnessed)).toEqual(['fx_2', 'fx_3', 'fx_1'])
  })

  it('clamps an index past the end of the stack', () => {
    const harnessed = harness({ document: stacked() })

    harnessed.store
      .getState()
      .dispatch(reorderEffect({ nodeId: id('a'), instanceId: 'fx_2', index: 99 }))

    expect(order(harnessed)).toEqual(['fx_1', 'fx_3', 'fx_2'])
  })

  it('writes nothing when the layer is already there', () => {
    const harnessed = harness({ document: stacked() })

    expect(
      capturePatches(harnessed, reorderEffect({ nodeId: id('a'), instanceId: 'fx_1', index: 0 })),
    ).toEqual([])
  })

  it('rejects an instance that is not on the node', () => {
    const harnessed = harness({ document: stacked() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(reorderEffect({ nodeId: id('a'), instanceId: 'fx_9', index: 0 })),
      ),
    ).toBe(COMMAND_CODES.effectNotFound)
  })
})
