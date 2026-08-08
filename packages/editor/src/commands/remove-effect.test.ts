import { type EffectInstance, doc, effectId, node } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { removeEffect } from './remove-effect'

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
    node({ id: id('a'), parentId: id('root'), effects: [instance('fx_1'), instance('fx_2')] }),
  ])

describe('removeEffect', () => {
  it('removes the named instance and keeps the rest of the stack', () => {
    const harnessed = harness({ document: stacked() })

    harnessed.store.getState().dispatch(removeEffect({ nodeId: id('a'), instanceId: 'fx_1' }))

    expect(harnessed.document().nodes[id('a')]?.effects.map((effect) => effect.id)).toEqual([
      'fx_2',
    ])
  })

  it('rejects an instance that is not on the node', () => {
    const harnessed = harness({ document: stacked() })

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(removeEffect({ nodeId: id('a'), instanceId: 'fx_9' })),
      ),
    ).toBe(COMMAND_CODES.effectNotFound)
  })
})
