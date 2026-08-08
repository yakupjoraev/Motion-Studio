import { nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { capturePatches, codeOf, harness, id } from '../test/harness'

import { setLocked } from './set-locked'

describe('setLocked', () => {
  it('locks every node in the payload', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(setLocked({ ids: [id('a'), id('b')], locked: true }))

    const document = harnessed.document()

    expect([document.nodes[id('a')]?.locked, document.nodes[id('b')]?.locked]).toEqual([true, true])
  })

  it('unlocks again', () => {
    const harnessed = harness()
    const state = harnessed.store.getState()

    state.dispatch(setLocked({ ids: [id('a')], locked: true }))
    state.dispatch(setLocked({ ids: [id('a')], locked: false }))

    expect(harnessed.document().nodes[id('a')]?.locked).toBe(false)
  })

  it('writes nothing when the nodes are already in that state', () => {
    const harnessed = harness()

    expect(capturePatches(harnessed, setLocked({ ids: [id('a')], locked: false }))).toEqual([])
  })

  it('reads as an undo label', () => {
    expect(setLocked({ ids: [], locked: true }).label).toBe('Lock')
    expect(setLocked({ ids: [], locked: false }).label).toBe('Unlock')
  })

  it('reports a node that is not there', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(setLocked({ ids: [nodeId('node_absent')], locked: true })),
      ),
    ).toBe('NODE_NOT_FOUND')
  })
})
