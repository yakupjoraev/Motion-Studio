import { type MotionSpec, doc, fixtureBlockId, node } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { capturePatches, codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { setMotion } from './set-motion'

const spec = (overrides: Partial<MotionSpec> = {}): MotionSpec => ({
  presetId: 'fade-up',
  channel: 'entrance',
  trigger: { kind: 'mount' },
  params: { duration: 400 },
  ...overrides,
})

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

describe('setMotion', () => {
  it('stores the spec under its own channel', () => {
    const harnessed = harness({ document: cardDocument() })

    harnessed.store.getState().dispatch(setMotion({ nodeId: id('a'), spec: spec() }))

    expect(harnessed.document().nodes[id('a')]?.motion).toEqual({
      entrance: {
        presetId: 'fade-up',
        channel: 'entrance',
        trigger: { kind: 'mount' },
        params: { duration: 400 },
      },
    })
  })

  it('writes one patch for the channel', () => {
    const harnessed = harness({ document: cardDocument() })

    expect(
      capturePatches(harnessed, setMotion({ nodeId: id('a'), spec: spec() })).map(
        (patch) => patch.path,
      ),
    ).toEqual([['nodes', id('a'), 'motion', 'entrance']])
  })

  it('rejects a channel the block does not declare', () => {
    const harnessed = harness({ document: cardDocument() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(setMotion({ nodeId: id('a'), spec: spec({ channel: 'scroll' }) })),
      ),
    ).toBe(COMMAND_CODES.unsupportedMotionChannel)
  })

  it('rejects a spec the schema refuses', () => {
    const harnessed = harness({ document: cardDocument() })

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(
          setMotion({
            nodeId: id('a'),
            spec: spec({ trigger: { kind: 'inView', amount: 4, once: true, margin: '' } }),
          }),
        ),
      ),
    ).toBe(COMMAND_CODES.invalidMotionSpec)
  })

  it('coalesces per node', () => {
    expect(setMotion({ nodeId: id('a'), spec: spec() }).coalesceKey).toBe(`set-motion:${id('a')}`)
  })
})
