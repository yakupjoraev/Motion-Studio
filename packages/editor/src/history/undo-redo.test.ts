import { doc, node, tree, treeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { applyCommands } from '../commands/dispatch'
import { removeNodes } from '../commands/remove-nodes'
import { renameNode } from '../commands/rename-node'
import { EMPTY_SELECTION } from '../store/slices/selection-slice'
import { commandRegistry } from '../test/harness'

import type { HistoryEntry } from './history.types'
import { redoStep, undoStep } from './undo-redo'

const id = treeId
const registry = commandRegistry()
const context = { registry, generateId: () => id('generated'), now: () => 0 }

const document = doc(tree({ root: ['a', 'b'] }))

/** Real patches from the real pipeline — TESTING.md § Unit tests: no mocking of our own modules. */
const entryFor = (
  command: Parameters<typeof applyCommands>[1][number],
  selectionBefore: readonly ReturnType<typeof treeId>[] = [],
): { entry: HistoryEntry; next: ReturnType<typeof doc> } => {
  const outcome = applyCommands(document, [command], context)

  if (outcome === null) {
    throw new Error('the fixture command wrote nothing')
  }

  return {
    next: outcome.document,
    entry: {
      id: 'hist_1',
      label: 'Fixture',
      patches: outcome.patches,
      inversePatches: outcome.inversePatches,
      selectionBefore,
      coalesceKey: null,
      timestamp: 0,
    },
  }
}

describe('undoStep', () => {
  it('has nothing to do on an empty past', () => {
    expect(undoStep({ document, selection: EMPTY_SELECTION, past: [], future: [] })).toBeNull()
  })

  it('reverts the document and moves the entry to the future', () => {
    const { entry, next } = entryFor(renameNode({ nodeId: id('a'), name: 'Hero' }))

    const travelled = undoStep({
      document: next,
      selection: EMPTY_SELECTION,
      past: [entry],
      future: [],
    })

    expect(travelled?.document).toEqual(document)
    expect(travelled?.past).toEqual([])
    expect(travelled?.future).toEqual([entry])
  })

  it('restores the selection the command was issued from', () => {
    const { entry, next } = entryFor(renameNode({ nodeId: id('a'), name: 'Hero' }), [id('a')])

    expect(
      undoStep({ document: next, selection: EMPTY_SELECTION, past: [entry], future: [] })?.selection
        .ids,
    ).toEqual([id('a')])
  })

  it('prunes a restored selection against the document the undo produced', () => {
    // The node was inserted *after* this entry was recorded, so undoing to it leaves an id with no
    // node — the case that crashes the inspector if it survives.
    const { entry, next } = entryFor(removeNodes({ ids: [id('b')] }), [id('ghost')])

    expect(
      undoStep({ document: next, selection: EMPTY_SELECTION, past: [entry], future: [] })?.selection
        .ids,
    ).toEqual([])
  })
})

describe('redoStep', () => {
  it('has nothing to do on an empty future', () => {
    expect(redoStep({ document, selection: EMPTY_SELECTION, past: [], future: [] })).toBeNull()
  })

  it('re-applies the forward patches', () => {
    const { entry, next } = entryFor(renameNode({ nodeId: id('a'), name: 'Hero' }))

    const travelled = redoStep({
      document,
      selection: EMPTY_SELECTION,
      past: [],
      future: [entry],
    })

    expect(travelled?.document).toEqual(next)
    expect(travelled?.past).toEqual([entry])
    expect(travelled?.future).toEqual([])
  })

  it('keeps the selection the user is looking at, minus what the redo removed — ADR-065', () => {
    const { entry } = entryFor(removeNodes({ ids: [id('b')] }))
    const selection = { ...EMPTY_SELECTION, ids: [id('a'), id('b')], hoverId: id('b') }

    const travelled = redoStep({ document, selection, past: [], future: [entry] })

    expect(travelled?.selection.ids).toEqual([id('a')])
    expect(travelled?.selection.hoverId).toBeNull()
  })
})

describe('a document the fixtures did not build', () => {
  it('undoes a structural change back to the exact original', () => {
    const single = doc([node({ id: id('root'), slot: 'root', children: [] })])
    const outcome = applyCommands(
      single,
      [renameNode({ nodeId: id('root'), name: 'Page' })],
      context,
    )

    expect(
      undoStep({
        document: outcome?.document ?? single,
        selection: EMPTY_SELECTION,
        past: [
          {
            id: 'hist_1',
            label: 'Fixture',
            patches: outcome?.patches ?? [],
            inversePatches: outcome?.inversePatches ?? [],
            selectionBefore: [],
            coalesceKey: null,
            timestamp: 0,
          },
        ],
        future: [],
      })?.document,
    ).toEqual(single)
  })
})
