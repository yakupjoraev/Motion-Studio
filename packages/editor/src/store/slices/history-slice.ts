import type { HistorySlice } from '../store.types'

import type { SliceCreator } from './slice.types'

const EMPTY_HISTORY = { past: [], future: [] } as const

/**
 * **A stub, on purpose.** Prompt 15 fills it: coalescing, transactions, the 200-entry cap, and undo
 * with selection pruning. What is real here is the shape and the one seam — `recordHistory` is the
 * single call `dispatch` makes, so the mechanism lands in one file rather than being threaded through
 * the document slice.
 *
 * `undo` and `redo` are no-ops rather than throws because an empty history makes them no-ops anyway:
 * `Mod+Z` with nothing to undo does nothing today and will do nothing after prompt 15.
 */
export const createHistorySlice = (): SliceCreator<HistorySlice> => (set) => ({
  history: EMPTY_HISTORY,
  canUndo: false,
  canRedo: false,

  recordHistory() {
    // Prompt 15 writes the entry. Until then nothing accumulates, which is why `canUndo` is false.
  },

  undo() {},

  redo() {},

  clearHistory() {
    set({ history: EMPTY_HISTORY, canUndo: false, canRedo: false }, false, 'clearHistory')
  },

  beginTransaction() {},

  endTransaction() {},
})
