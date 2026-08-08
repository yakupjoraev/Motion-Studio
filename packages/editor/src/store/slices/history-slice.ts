import type { HistoryState, IncomingEntry, OpenTransaction } from '../../history/history.types'
import { recordEntry } from '../../history/record-history'
import { accumulate, closeTransaction, openTransaction } from '../../history/transaction'
import { redoStep, undoStep } from '../../history/undo-redo'
import type { HistorySlice } from '../store.types'

import type { ResolvedOptions, SliceCreator } from './slice.types'

const EMPTY_HISTORY: HistoryState = { past: [], future: [] }

/** Dev only: a transaction that outlives a macrotask is a `finally` somebody forgot. */
const warnIfStillOpen = (
  read: () => OpenTransaction | null,
  token: string,
  label: string,
): void => {
  if (process.env['NODE_ENV'] === 'production') {
    return
  }

  setTimeout(() => {
    const current = read()

    if (current !== null && current.token === token) {
      console.warn(
        `Transaction "${label}" is still open a macrotask after it began. Every command until endTransaction joins it.`,
      )
    }
  }, 0)
}

/**
 * EDITOR_ENGINE.md § History. The slice is the plumbing; the decisions live in `src/history/` as pure
 * functions, which is what lets coalescing and the inverse-patch direction be tested without a store.
 *
 * `recordHistory` stays the single seam `dispatch` calls: with a transaction open it accumulates, and
 * without one it writes an entry. Nothing else in the package writes to `history`.
 */
export const createHistorySlice =
  ({ context, coalesceWindow }: ResolvedOptions): SliceCreator<HistorySlice> =>
  (set, get) => {
    // Per store, and deliberately not `context.generateId` — a history id would shift the document's
    // node ids, and it never reaches the document — ADR-066.
    let sequence = 0
    const nextId = (prefix: string): string => {
      sequence += 1

      return `${prefix}_${sequence}`
    }

    const write = (incoming: IncomingEntry): void => {
      const history = recordEntry(get().history, incoming, {
        now: context.now(),
        coalesceWindow,
        id: nextId('hist'),
      })

      set({ history, canUndo: history.past.length > 0, canRedo: false }, false, 'recordHistory')
    }

    return {
      history: EMPTY_HISTORY,
      transaction: null,
      canUndo: false,
      canRedo: false,

      recordHistory(incoming) {
        const { transaction } = get()

        if (transaction !== null) {
          set({ transaction: accumulate(transaction, incoming) }, false, 'transaction/accumulate')

          return
        }

        write(incoming)
      },

      undo() {
        const { document, selection, history } = get()
        const travelled = undoStep({ document, selection, ...history })

        if (travelled === null) {
          return
        }

        set(
          {
            document: travelled.document,
            selection: travelled.selection,
            history: { past: travelled.past, future: travelled.future },
            canUndo: travelled.past.length > 0,
            canRedo: true,
            version: get().version + 1,
            dirty: true,
          },
          false,
          'undo',
        )
      },

      redo() {
        const { document, selection, history } = get()
        const travelled = redoStep({ document, selection, ...history })

        if (travelled === null) {
          return
        }

        set(
          {
            document: travelled.document,
            selection: travelled.selection,
            history: { past: travelled.past, future: travelled.future },
            canUndo: true,
            canRedo: travelled.future.length > 0,
            version: get().version + 1,
            dirty: true,
          },
          false,
          'redo',
        )
      },

      clearHistory() {
        set(
          { history: EMPTY_HISTORY, transaction: null, canUndo: false, canRedo: false },
          false,
          'clearHistory',
        )
      },

      beginTransaction(label) {
        const { transaction, selection } = get()
        const token = transaction?.token ?? nextId('tx')

        set(
          { transaction: openTransaction(transaction, label, selection.ids, token) },
          false,
          'beginTransaction',
        )

        if (transaction === null) {
          warnIfStillOpen(() => get().transaction, token, label)
        }
      },

      endTransaction() {
        const { transaction } = get()

        if (transaction === null) {
          return
        }

        const outcome = closeTransaction(transaction)

        set({ transaction: outcome.transaction }, false, 'endTransaction')

        if (outcome.entry !== null) {
          write(outcome.entry)
        }
      },
    }
  }
