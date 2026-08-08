import { MAX_NAME_LENGTH, nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { capturePatches, codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { renameNode } from './rename-node'

describe('renameNode', () => {
  it('renames the node and trims the input', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(renameNode({ nodeId: id('a'), name: '  Hero  ' }))

    expect(harnessed.document().nodes[id('a')]?.name).toBe('Hero')
  })

  it('writes one patch', () => {
    const harnessed = harness()

    expect(capturePatches(harnessed, renameNode({ nodeId: id('a'), name: 'Hero' }))).toEqual([
      { op: 'replace', path: ['nodes', id('a'), 'name'], value: 'Hero' },
    ])
  })

  it('rejects a blank name', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(renameNode({ nodeId: id('a'), name: '   ' })),
      ),
    ).toBe(COMMAND_CODES.invalidName)
  })

  it('rejects a name the file format could not store', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(renameNode({ nodeId: id('a'), name: 'x'.repeat(MAX_NAME_LENGTH + 1) })),
      ),
    ).toBe(COMMAND_CODES.invalidName)
  })

  it('reports a node that is not there', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(renameNode({ nodeId: nodeId('node_absent'), name: 'x' })),
      ),
    ).toBe('NODE_NOT_FOUND')
  })

  it('coalesces per node', () => {
    expect(renameNode({ nodeId: id('a'), name: 'Hero' }).coalesceKey).toBe(`rename:${id('a')}`)
  })
})
