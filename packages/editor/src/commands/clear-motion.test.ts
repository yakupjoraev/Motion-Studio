import { doc, node } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { capturePatches, codeOf, harness, id } from '../test/harness'

import { clearMotion } from './clear-motion'

const animated = (): ReturnType<typeof doc> =>
  doc([
    node({ id: id('root'), slot: 'root', children: [id('a')] }),
    node({
      id: id('a'),
      parentId: id('root'),
      motion: {
        entrance: {
          presetId: 'fade-up',
          channel: 'entrance',
          trigger: { kind: 'mount' },
          params: {},
        },
        hover: { presetId: 'lift', channel: 'hover', trigger: { kind: 'hover' }, params: {} },
      },
    }),
  ])

describe('clearMotion', () => {
  it('removes one channel and leaves the others', () => {
    const harnessed = harness({ document: animated() })

    harnessed.store.getState().dispatch(clearMotion({ nodeId: id('a'), channel: 'entrance' }))

    expect(Object.keys(harnessed.document().nodes[id('a')]?.motion ?? {})).toEqual(['hover'])
  })

  it('writes nothing when the channel is already empty', () => {
    const harnessed = harness({ document: animated() })

    expect(capturePatches(harnessed, clearMotion({ nodeId: id('a'), channel: 'exit' }))).toEqual([])
  })

  it('removes a channel the block does not declare, which is the repair path', () => {
    const harnessed = harness({ document: animated() })

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(clearMotion({ nodeId: id('a'), channel: 'hover' })),
      ),
    ).toBe('NO_ERROR')
  })
})
