import { type EffectInstance, doc, effectId, node } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { setEffect } from './set-effect'

const NOISE = effectId('noise-overlay')

const instance = (name: string, params: Record<string, unknown> = {}): EffectInstance => ({
  id: name,
  effectId: NOISE,
  params,
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
      effects: [instance('fx_1', { amount: 0.2, scale: 3 }), instance('fx_2')],
    }),
  ])

describe('setEffect', () => {
  it('merges params key by key and leaves the rest of the instance alone', () => {
    const harnessed = harness({ document: stacked() })

    harnessed.store
      .getState()
      .dispatch(setEffect({ nodeId: id('a'), instanceId: 'fx_1', params: { amount: 0.8 } }))

    expect(harnessed.document().nodes[id('a')]?.effects[0]).toEqual(
      instance('fx_1', { amount: 0.8, scale: 3 }),
    )
  })

  it('sets the layer, the blend mode and the opacity', () => {
    const harnessed = harness({ document: stacked() })

    harnessed.store.getState().dispatch(
      setEffect({
        nodeId: id('a'),
        instanceId: 'fx_2',
        layer: 'front',
        blendMode: 'screen',
        opacity: 0.5,
      }),
    )

    expect(harnessed.document().nodes[id('a')]?.effects[1]).toMatchObject({
      layer: 'front',
      blendMode: 'screen',
      opacity: 0.5,
    })
  })

  it('rejects an instance that is not on the node', () => {
    const harnessed = harness({ document: stacked() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(setEffect({ nodeId: id('a'), instanceId: 'fx_absent', opacity: 1 })),
      ),
    ).toBe(COMMAND_CODES.effectNotFound)
  })

  it('rejects a value outside the schema bounds', () => {
    const harnessed = harness({ document: stacked() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(setEffect({ nodeId: id('a'), instanceId: 'fx_1', opacity: 4 })),
      ),
    ).toBe(COMMAND_CODES.invalidEffect)
  })

  it('coalesces per instance, not per catalogue entry', () => {
    expect(setEffect({ nodeId: id('a'), instanceId: 'fx_1', opacity: 1 }).coalesceKey).toBe(
      `set-effect:${id('a')}:fx_1`,
    )
  })
})
