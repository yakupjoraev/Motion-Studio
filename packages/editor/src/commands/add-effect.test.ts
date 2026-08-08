import { type EffectInstance, doc, effectId, node } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { codeOf, harness, id } from '../test/harness'

import { MAX_EFFECTS, addEffect } from './add-effect'
import { COMMAND_CODES } from './guards'

const NOISE = effectId('noise-overlay')

const instance = (index: number): EffectInstance => ({
  id: `fx_seed${index}`,
  effectId: NOISE,
  params: {},
  layer: 'behind',
  blendMode: 'normal',
  opacity: 1,
})

const withEffects = (count: number): ReturnType<typeof doc> =>
  doc([
    node({ id: id('root'), slot: 'root', children: [id('a')] }),
    node({
      id: id('a'),
      parentId: id('root'),
      effects: Array.from({ length: count }, (_, index) => instance(index)),
    }),
  ])

describe('addEffect', () => {
  it('appends an instance with the schema defaults filled in', () => {
    const harnessed = harness({ document: withEffects(0) })

    harnessed.store.getState().dispatch(addEffect({ nodeId: id('a'), effectId: NOISE }))

    expect(harnessed.document().nodes[id('a')]?.effects).toEqual([
      { id: 'fx_1', effectId: NOISE, params: {}, layer: 'behind', blendMode: 'normal', opacity: 1 },
    ])
  })

  it('keeps the params the caller passed, and the id the caller chose', () => {
    const harnessed = harness({ document: withEffects(0) })

    harnessed.store
      .getState()
      .dispatch(
        addEffect({ nodeId: id('a'), effectId: NOISE, params: { amount: 0.4 }, id: 'fx_chosen' }),
      )

    expect(harnessed.document().nodes[id('a')]?.effects[0]).toMatchObject({
      id: 'fx_chosen',
      params: { amount: 0.4 },
    })
  })

  it('rejects a ninth layer', () => {
    const harnessed = harness({ document: withEffects(MAX_EFFECTS) })

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(addEffect({ nodeId: id('a'), effectId: NOISE })),
      ),
    ).toBe(COMMAND_CODES.effectStackFull)
  })

  it('rejects an id that is not an effect instance id', () => {
    const harnessed = harness({ document: withEffects(0) })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(addEffect({ nodeId: id('a'), effectId: NOISE, id: 'not-an-id' })),
      ),
    ).toBe(COMMAND_CODES.invalidEffect)
  })
})
