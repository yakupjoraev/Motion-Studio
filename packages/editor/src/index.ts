export {
  EMPTY_SELECTION,
  INITIAL_UI,
  INITIAL_VIEWPORT,
  PANEL_BOUNDS,
  createEditorStore,
  normalizeSelection,
  pruneSelection,
  useEditorStore,
} from './store/index'
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

export { applyCommands, type CommandOutcome } from './commands/dispatch'
export type { Command, CommandContext } from './commands/command.types'

// The deterministic store every downstream test builds on — TESTING.md § Determinism. Tree-shaken
// out of anything that does not import it, exactly like `schema`'s factories.
export { createTestStore, type TestStoreOptions } from './test/create-test-store'
