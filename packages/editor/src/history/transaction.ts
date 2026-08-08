import type { NodeId } from '@motion-studio/schema'

import type { IncomingEntry, OpenTransaction } from './history.types'

/**
 * EDITOR_ENGINE.md § Transactions. Nesting is flattened by the depth counter: an inner
 * `beginTransaction` joins the one already open rather than starting a second, so a command that
 * transacts internally can be called from inside a paste without producing two undo steps.
 */
export function openTransaction(
  current: OpenTransaction | null,
  label: string,
  selectionBefore: readonly NodeId[],
  token: string,
): OpenTransaction {
  if (current !== null) {
    return { ...current, depth: current.depth + 1 }
  }

  return { token, label, depth: 1, patches: [], inversePatches: [], selectionBefore }
}

/**
 * **Inverse patches accumulate in reverse.** `applyPatches` walks the list in order, so undoing three
 * commands means undoing the third, then the second, then the first — the opposite order to the one
 * they were recorded in.
 */
export function accumulate(open: OpenTransaction, incoming: IncomingEntry): OpenTransaction {
  return {
    ...open,
    patches: [...open.patches, ...incoming.patches],
    inversePatches: [...incoming.inversePatches, ...open.inversePatches],
  }
}

export interface TransactionOutcome {
  readonly transaction: OpenTransaction | null
  /** `null` while an inner transaction closes, and for a transaction that changed nothing. */
  readonly entry: IncomingEntry | null
}

export function closeTransaction(open: OpenTransaction): TransactionOutcome {
  if (open.depth > 1) {
    return { transaction: { ...open, depth: open.depth - 1 }, entry: null }
  }

  if (open.patches.length === 0) {
    return { transaction: null, entry: null }
  }

  return {
    transaction: null,
    entry: {
      label: open.label,
      patches: open.patches,
      inversePatches: open.inversePatches,
      selectionBefore: open.selectionBefore,
      // A transaction is one deliberate operation; merging two of them into one undo step would
      // make "paste, paste" a single step.
      coalesceKey: null,
    },
  }
}
