export { COALESCE_WINDOW_MS, mergeEntries, shouldCoalesce } from './coalesce'
export type {
  HistoryEntry,
  HistoryState,
  IncomingEntry,
  OpenTransaction,
} from './history.types'
export { pruneSelection } from './prune-selection'
export { HISTORY_LIMIT, recordEntry, type RecordOptions } from './record-history'
export {
  accumulate,
  closeTransaction,
  openTransaction,
  type TransactionOutcome,
} from './transaction'
export { redoStep, undoStep, type Travel, type TravelInput } from './undo-redo'
