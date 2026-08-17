import type { BlockRegistry, BreakpointId, MotionDocument, NodeId } from '@motion-studio/schema'
import type { ColorModePreference, PresetId, ThemeConfig } from '@motion-studio/theme'
import type { MotionStudioError, Point, Result } from '@motion-studio/utils'
import type { Mutate, StoreApi, UseBoundStore } from 'zustand'

import type {
  PasteReport,
  PasteTarget,
  SerializedSubtree,
  StyleClipboard,
} from '../clipboard/clipboard.types'
import type { Command } from '../commands/command.types'
import type { HistoryState, IncomingEntry, OpenTransaction } from '../history/history.types'

/**
 * STATE_MANAGEMENT.md § Store shape. The seven slices merge **flat**: `state.document` is the
 * document and `state.dispatch` is a method on the store root, so a component subscribes to the
 * narrowest field it needs without walking a namespace first.
 */
export type EditorState = DocumentSlice &
  SelectionSlice &
  ViewportSlice &
  HistorySlice &
  ClipboardSlice &
  UiSlice &
  ThemeSlice

export type EditorStore = UseBoundStore<
  Mutate<
    StoreApi<EditorState>,
    [['zustand/subscribeWithSelector', never], ['zustand/devtools', never]]
  >
>

export interface EditorStoreOptions {
  /** The block seam. Commands ask it whether a slot accepts a block — ARCHITECTURE.md § The registry seam. */
  readonly registry: BlockRegistry
  /** Required, never defaulted: a store that reads a clock of its own is a store no test can pin — ADR-056. */
  readonly now: () => number
  readonly generateId?: (() => NodeId) | undefined
  /** An empty document is built when none is given, which is what `New` means. */
  readonly document?: MotionDocument | undefined
  /** Milliseconds; `0` disables coalescing. Read by the history slice — EDITOR_ENGINE.md § Coalescing. */
  readonly coalesceWindow?: number | undefined
}

export interface DocumentSlice {
  document: MotionDocument
  /** Monotonic. Memoised derivations key off it, so a cache check is one integer comparison. */
  version: number
  dirty: boolean
  dispatch(command: Command): void
  dispatchBatch(commands: readonly Command[], label: string, coalesceKey?: string): void
  /** The load path: clears history rather than recording a whole-document entry — ADR-054. */
  replaceDocument(next: MotionDocument): void
}

export type SelectionMode = 'replace' | 'add' | 'toggle' | 'range'

export interface SelectionState {
  /** Always in document order, and never both a node and one of its ancestors — § Normalization. */
  readonly ids: readonly NodeId[]
  readonly anchorId: NodeId | null
  readonly editingId: NodeId | null
  readonly hoverId: NodeId | null
  /** The container the user has "entered". `null` is the top level. */
  readonly isolationId: NodeId | null
}

export interface SelectionSlice {
  selection: SelectionState
  select(ids: readonly NodeId[], mode?: SelectionMode): void
  selectAll(): void
  clearSelection(): void
  enterNode(id: NodeId): void
  exitNode(): void
  setHover(id: NodeId | null): void
  setEditing(id: NodeId | null): void
}

export interface ViewportState {
  /** 0.1 – 4, quantised to 0.0001 so the displayed percentage has no float noise — CANVAS.md § Zoom. */
  readonly zoom: number
  /** Canvas units, committed values only. */
  readonly pan: Point
  readonly breakpoint: BreakpointId
  readonly grid: { readonly enabled: boolean; readonly size: number }
  readonly guides: { readonly enabled: boolean; readonly snapThreshold: number }
  readonly rulers: boolean
  readonly motionPaused: boolean
  readonly previewReducedMotion: boolean
  /** ADR-162. `base`, `md` and `xl` side by side, read-only — RESPONSIVE_ENGINE.md § Canvas preview. */
  readonly multiFrame: boolean
}

export interface ViewportSlice {
  viewport: ViewportState
  /** `origin` is the canvas point to hold still — the anchor of a zoom at the cursor. */
  setZoom(zoom: number, origin?: Point): void
  setPan(pan: Point): void
  setBreakpoint(id: BreakpointId): void
  toggleGrid(): void
  toggleSnapping(): void
  toggleRulers(): void
  toggleMotionPaused(): void
  setPreviewReducedMotion(preview: boolean): void
  toggleMultiFrame(): void
}

export type { HistoryEntry, IncomingEntry, OpenTransaction } from '../history/history.types'

export interface HistorySlice {
  history: HistoryState
  /**
   * The open transaction, or `null`. In the store rather than in a closure so a test and the devtools
   * timeline can both see one that was left open — which is the failure it exists to catch.
   */
  transaction: OpenTransaction | null
  canUndo: boolean
  canRedo: boolean
  /** The single seam between dispatch and history. */
  recordHistory(entry: IncomingEntry): void
  undo(): void
  redo(): void
  clearHistory(): void
  beginTransaction(label: string): void
  endTransaction(): void
}

export interface ClipboardSlice {
  clipboard: {
    readonly nodes: SerializedSubtree | null
    readonly style: StyleClipboard | null
  }
  copy(ids: readonly NodeId[]): Promise<void>
  cut(ids: readonly NodeId[]): Promise<void>
  /**
   * Async because reading the system clipboard is, and it returns a `Result` because a paste can
   * decline (nothing usable on the clipboard) or land partially (a block this build does not
   * have) — ADR-067. `target` bypasses resolution, which is what a drop on the canvas needs.
   */
  paste(target?: PasteTarget): Promise<Result<PasteReport, MotionStudioError>>
  pasteInPlace(): Promise<Result<PasteReport, MotionStudioError>>
  copyStyle(id: NodeId): void
  pasteStyle(ids: readonly NodeId[]): void
}

/** PRODUCT.md § 2, in tab order. `Alt+1` … `Alt+5` — SHORTCUTS.md § Panels. */
export type LeftTab = 'blocks' | 'motion' | 'effects' | 'theme' | 'layers'

/**
 * The dialogs that are not their own flag. `Mod+,` and `Mod+/` are SHORTCUTS.md § Global; the import
 * report is FILE_FORMAT.md § Repair. The command palette and the export dialog keep their own booleans
 * because STATE_MANAGEMENT.md § ui declares them that way.
 */
export type DialogId = 'settings' | 'shortcuts' | 'import-report'

export type PanelSide = 'left' | 'right'

export interface UiState {
  readonly leftPanel: { readonly tab: LeftTab; readonly width: number; readonly collapsed: boolean }
  readonly rightPanel: {
    readonly width: number
    readonly collapsed: boolean
    readonly openSections: Readonly<Record<string, boolean>>
  }
  readonly commandPaletteOpen: boolean
  readonly exportDialogOpen: boolean
  readonly activeDialog: DialogId | null
  readonly fpsVisible: boolean
}

export interface UiSlice {
  ui: UiState
  setLeftTab(tab: LeftTab): void
  setPanelWidth(side: PanelSide, width: number): void
  togglePanel(side: PanelSide): void
  setSectionOpen(section: string, open: boolean): void
  setCommandPaletteOpen(open: boolean): void
  setExportDialogOpen(open: boolean): void
  setActiveDialog(dialog: DialogId | null): void
  setFpsVisible(visible: boolean): void
}

/**
 * No state of its own: the config is `document.theme`, and a copy beside it would be derived data in
 * the store — STATE_MANAGEMENT.md § Anti-patterns. Reads go through `selectTheme`.
 */
export interface ThemeSlice {
  setThemeToken(path: string, value: unknown): void
  setColorMode(mode: ColorModePreference): void
  applyThemePreset(id: PresetId): void
  /** A config no `PresetId` names: a saved custom preset, or an imported one — ADR-173. */
  setTheme(theme: ThemeConfig): void
}
