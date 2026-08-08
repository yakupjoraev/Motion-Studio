import { doc, fakeRegistry, nodeId } from '@motion-studio/schema'
import { counterIds } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { failing, noop, renameRoot } from '../test/commands'

import type { CommandContext } from './command.types'
import { applyCommands } from './dispatch'

const context = (): CommandContext => {
  const next = counterIds()

  return {
    registry: fakeRegistry(),
    generateId: () => nodeId(next()),
    now: () => 1_700_000_000_000,
  }
}

/** The schema's own fixture, whose root node is named `Page` — TESTING.md § Determinism. */
const document = () => doc()

describe('applyCommands', () => {
  it('returns forward and inverse patches for a real mutation', () => {
    const before = document()
    const outcome = applyCommands(before, [renameRoot('Landing')], context())

    expect(outcome).not.toBeNull()
    expect(outcome?.patches).toEqual([
      { op: 'replace', path: ['nodes', before.rootId, 'name'], value: 'Landing' },
    ])
    expect(outcome?.inversePatches).toEqual([
      { op: 'replace', path: ['nodes', before.rootId, 'name'], value: 'Page' },
    ])
  })

  it('leaves the document it was given untouched', () => {
    const before = document()
    const outcome = applyCommands(before, [renameRoot('Landing')], context())

    expect(before.nodes[before.rootId]?.name).toBe('Page')
    expect(outcome?.document.nodes[before.rootId]?.name).toBe('Landing')
  })

  it('drops a command that produces no patches', () => {
    expect(applyCommands(document(), [noop()], context())).toBeNull()
  })

  it('drops a command that writes the value already there', () => {
    expect(applyCommands(document(), [renameRoot('Page')], context())).toBeNull()
  })

  it('applies a list as one outcome', () => {
    const before = document()
    const outcome = applyCommands(before, [renameRoot('One'), renameRoot('Two')], context())

    expect(outcome?.document.nodes[before.rootId]?.name).toBe('Two')
    expect(outcome?.patches).toHaveLength(1)
  })

  it('propagates a throw with the document untouched', () => {
    const before = document()

    expect(() => applyCommands(before, [failing('rejected')], context())).toThrow('rejected')
    expect(before.nodes[before.rootId]?.name).toBe('Page')
  })

  it('freezes what it produces, so a later mutation cannot slip past a command', () => {
    const outcome = applyCommands(document(), [renameRoot('Landing')], context())

    expect(Object.isFrozen(outcome?.document.nodes)).toBe(true)
  })
})
