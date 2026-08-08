import { mergeEntries, shouldCoalesce } from './coalesce'
import type { HistoryEntry, HistoryState, IncomingEntry } from './history.types'

/**
 * EDITOR_ENGINE.md § Limits. Patches are small, so 200 is generous rather than tight, and the oldest
 * is dropped without consequence: entries are independent inverse patch sets, not a snapshot chain.
 */
export const HISTORY_LIMIT = 200

export interface RecordOptions {
  readonly now: number
  readonly coalesceWindow: number
  /** Supplied by the caller so this stays pure — ADR-066. */
  readonly id: string
}

/** The one path that writes an entry. `future` clears on any new command, as a redo stack must. */
export function recordEntry(
  history: HistoryState,
  incoming: IncomingEntry,
  options: RecordOptions,
): HistoryState {
  const top = history.past.at(-1)

  if (top !== undefined && shouldCoalesce(top, incoming, options.now, options.coalesceWindow)) {
    return {
      past: [...history.past.slice(0, -1), mergeEntries(top, incoming, options.now)],
      future: [],
    }
  }

  const entry: HistoryEntry = { ...incoming, id: options.id, timestamp: options.now }
  const past = [...history.past, entry]

  return { past: past.slice(Math.max(0, past.length - HISTORY_LIMIT)), future: [] }
}
