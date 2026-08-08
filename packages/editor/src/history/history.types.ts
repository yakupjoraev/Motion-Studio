import type { NodeId } from '@motion-studio/schema'
import type { Patch } from 'immer'

/**
 * EDITOR_ENGINE.md § History. An entry is a pair of patch sets, not a snapshot: that is what makes
 * 200 of them cost kilobytes, and it is why dropping the oldest is safe — entries are independent.
 */
export interface HistoryEntry {
  readonly id: string
  /** User-visible, shown in the undo tooltip: "Set background". */
  readonly label: string
  readonly patches: readonly Patch[]
  readonly inversePatches: readonly Patch[]
  readonly selectionBefore: readonly NodeId[]
  readonly coalesceKey: string | null
  readonly timestamp: number
}

/** What `dispatch` hands the history slice: an entry without the id and the timestamp it will get. */
export interface IncomingEntry {
  readonly label: string
  readonly patches: readonly Patch[]
  readonly inversePatches: readonly Patch[]
  readonly selectionBefore: readonly NodeId[]
  readonly coalesceKey: string | null
}

export interface HistoryState {
  readonly past: readonly HistoryEntry[]
  readonly future: readonly HistoryEntry[]
}

/**
 * An open transaction. `depth` is what makes nesting flatten: only the outermost `endTransaction`
 * writes, and the inner ones just count back down.
 */
export interface OpenTransaction {
  readonly token: string
  readonly label: string
  readonly depth: number
  readonly patches: readonly Patch[]
  readonly inversePatches: readonly Patch[]
  /** The selection from before the *first* command, which is where an undo of the whole returns. */
  readonly selectionBefore: readonly NodeId[]
}
