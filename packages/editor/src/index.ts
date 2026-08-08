export {
  EMPTY_SELECTION,
  INITIAL_UI,
  INITIAL_VIEWPORT,
  PANEL_BOUNDS,
  createEditorStore,
  normalizeSelection,
  useEditorStore,
} from './store/index'
export {
  COALESCE_WINDOW_MS,
  HISTORY_LIMIT,
  pruneSelection,
  shouldCoalesce,
  type HistoryState,
  type OpenTransaction,
} from './history/index'
export type {
  ClipboardSlice,
  DialogId,
  DocumentSlice,
  EditorState,
  EditorStore,
  EditorStoreOptions,
  HistoryEntry,
  HistorySlice,
  IncomingEntry,
  LeftTab,
  PanelSide,
  SelectionMode,
  SelectionSlice,
  SelectionState,
  ThemeSlice,
  UiSlice,
  UiState,
  ViewportSlice,
  ViewportState,
} from './store/index'

export * as commands from './commands/index'
export * as selectors from './selectors/index'

export {
  CLIPBOARD_CODES,
  CLIPBOARD_MARKER,
  SUBTREE_VERSION,
  decodeClipboardText,
  deserializeSubtree,
  encodeClipboardText,
  serializeSubtree,
  type ClipboardCode,
  type PasteReport,
  type PasteTarget,
  type RejectedBlock,
  type SerializedSubtree,
  type StyleClipboard,
} from './clipboard/index'

export { applyCommands, type CommandOutcome } from './commands/dispatch'
export type { Command, CommandContext } from './commands/command.types'

// The deterministic store every downstream test builds on — TESTING.md § Determinism. Tree-shaken
// out of anything that does not import it, exactly like `schema`'s factories.
export { createTestStore, type TestStoreOptions } from './test/create-test-store'
