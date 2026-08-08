import type { HistoryEntry, IncomingEntry } from './history.types'

/** EDITOR_ENGINE.md § Coalescing. A pause mid-drag starts a new entry, which is what users expect. */
export const COALESCE_WINDOW_MS = 400

/**
 * A command joins the entry on top when it carries the same key and arrives inside the window. A
 * `null` key never coalesces — that is what makes structural commands one undo step each — and a
 * window of `0` disables the mechanism, which is what the property tests run with.
 */
export function shouldCoalesce(
  top: HistoryEntry | undefined,
  incoming: IncomingEntry,
  now: number,
  window: number,
): boolean {
  if (top === undefined || incoming.coalesceKey === null || window <= 0) {
    return false
  }

  if (top.coalesceKey !== incoming.coalesceKey) {
    return false
  }

  return now - top.timestamp <= window
}

/**
 * **The inverse patches are the older ones.** They are the way back to the state before the drag
 * started; keeping the incoming ones instead produces an undo that reverts only the last frame of the
 * drag — the bug that reads as "undo is broken" and is hard to see in a diff.
 */
export function mergeEntries(
  top: HistoryEntry,
  incoming: IncomingEntry,
  now: number,
): HistoryEntry {
  return { ...top, label: incoming.label, patches: incoming.patches, timestamp: now }
}
