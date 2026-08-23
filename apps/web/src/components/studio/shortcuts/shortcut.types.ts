import type { EditorStore } from '@motion-studio/editor'
import type { Shortcut } from '@motion-studio/hooks'
import type { ToastOptions } from '@motion-studio/ui'

/**
 * What a studio shortcut is handed. The store is the whole of it for anything that edits a document
 * or flips a piece of UI state, because both live there.
 *
 * `canvas` is separate and nullable: fitting the document and zooming to the selection need measured
 * geometry, which only exists while the canvas is mounted. A binding that needs it declares
 * `when: hasCanvas`, so the reference sheet greys it out rather than offering a key that does
 * nothing.
 */
export interface CanvasCommands {
  fitDocument(): void
  zoomToSelection(): void
  replayEntrances(): void
}

/**
 * The panels are the shell's own state (ADR-049/050: they are a layout preference in local storage,
 * not document state), so toggling one is a call into the shell rather than a store write.
 */
export interface PanelCommands {
  toggle(side: 'left' | 'right'): void
  isOpen(side: 'left' | 'right'): boolean
}

export interface StudioShortcutContext {
  readonly store: EditorStore
  readonly canvas: CanvasCommands | null
  readonly panels: PanelCommands | null
  /**
   * The toast publisher. Copy React is the one binding whose result is invisible — the clipboard
   * changed and the screen did not — so it is the one binding that has to be able to say so.
   */
  readonly notify: ((options: ToastOptions) => void) | null
}

export type StudioShortcut = Shortcut<StudioShortcutContext>

export const hasSelection = ({ store }: StudioShortcutContext): boolean =>
  store.getState().selection.ids.length > 0

export const hasCanvas = ({ canvas }: StudioShortcutContext): boolean => canvas !== null

export const hasPanels = ({ panels }: StudioShortcutContext): boolean => panels !== null
