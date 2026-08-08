import { nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { capturePatches, codeOf, harness, id } from '../test/harness'

import { setVisibility } from './set-visibility'

describe('setVisibility', () => {
  it('hides every node in the payload', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(setVisibility({ ids: [id('a'), id('b')], hidden: true }))

    const document = harnessed.document()

    expect([document.nodes[id('a')]?.hidden, document.nodes[id('b')]?.hidden]).toEqual([true, true])
    expect(document.nodes[id('c')]?.hidden).toBe(false)
  })

  it('writes nothing when the nodes are already in that state', () => {
    const harnessed = harness()

    expect(capturePatches(harnessed, setVisibility({ ids: [id('a')], hidden: false }))).toEqual([])
  })

  it('reads as an undo label', () => {
    expect(setVisibility({ ids: [], hidden: true }).label).toBe('Hide')
    expect(setVisibility({ ids: [], hidden: false }).label).toBe('Show')
  })

  it('reports a node that is not there', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(setVisibility({ ids: [nodeId('node_absent')], hidden: true })),
      ),
    ).toBe('NODE_NOT_FOUND')
  })
})
