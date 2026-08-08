import type { MotionDocument } from '@motion-studio/schema'
import { applyPatches, enablePatches } from 'immer'

import type { SelectionState } from '../store/store.types'

import type { HistoryEntry, HistoryState } from './history.types'
import { pruneSelection } from './prune-selection'

// Idempotent, and repeated here because a test may import this module without the dispatch path.
enablePatches()

export interface TravelInput extends HistoryState {
  readonly document: MotionDocument
  readonly selection: SelectionState
}

export interface Travel extends HistoryState {
  readonly document: MotionDocument
  readonly selection: SelectionState
  readonly entry: HistoryEntry
}

/**
 * EDITOR_ENGINE.md § Undo. `null` means there was nothing to undo, which is a no-op rather than an
 * error: `Mod+Z` on a fresh document does nothing.
 */
export function undoStep(input: TravelInput): Travel | null {
  const entry = input.past.at(-1)

  if (entry === undefined) {
    return null
  }

  const document = applyPatches(input.document, [...entry.inversePatches])

  return {
    entry,
    document,
    // The selection the command was issued from, minus anything the undo has just removed.
    selection: pruneSelection({ ...input.selection, ids: entry.selectionBefore }, document),
    past: input.past.slice(0, -1),
    future: [entry, ...input.future],
  }
}

/** Redo keeps the selection the user is looking at, pruned against the redone document — ADR-065. */
export function redoStep(input: TravelInput): Travel | null {
  const [entry] = input.future

  if (entry === undefined) {
    return null
  }

  const document = applyPatches(input.document, [...entry.patches])

  return {
    entry,
    document,
    selection: pruneSelection(input.selection, document),
    past: [...input.past, entry],
    future: input.future.slice(1),
  }
}
