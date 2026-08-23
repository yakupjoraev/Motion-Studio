import { type StudioShortcut, hasPanels } from './shortcut.types'

/** SHORTCUTS.md § Global, transcribed. Every row of that table is one entry here. */
export const GLOBAL_SHORTCUTS: readonly StudioShortcut[] = [
  {
    id: 'command-palette',
    keys: 'mod+k',
    label: 'Command palette',
    group: 'Global',
    scope: 'global',
    keywords: ['search', 'run', 'command'],
    run: ({ store }) => {
      store.getState().setCommandPaletteOpen(true)
    },
  },
  {
    id: 'undo',
    keys: 'mod+z',
    label: 'Undo',
    group: 'Global',
    scope: 'global',
    when: ({ store }) => store.getState().canUndo,
    run: ({ store }) => {
      store.getState().undo()
    },
  },
  {
    id: 'redo',
    keys: 'mod+shift+z',
    label: 'Redo',
    group: 'Global',
    scope: 'global',
    when: ({ store }) => store.getState().canRedo,
    run: ({ store }) => {
      store.getState().redo()
    },
  },
  {
    id: 'redo-alternate',
    keys: 'mod+y',
    label: 'Redo',
    group: 'Global',
    scope: 'global',
    when: ({ store }) => store.getState().canRedo,
    run: ({ store }) => {
      store.getState().redo()
    },
  },
  // Persistence is prompt 50 and the export dialog is prompt 45. The bindings are declared now
  // rather than later because a half-populated registry is what makes a later prompt add an ad-hoc
  // listener — `when` says the truth in the meantime and the sheet greys them out.
  {
    id: 'save-document',
    keys: 'mod+s',
    label: 'Save (download .motion)',
    group: 'Global',
    scope: 'global',
    when: () => false,
    run: () => undefined,
  },
  {
    id: 'open-document',
    keys: 'mod+o',
    label: 'Open .motion',
    group: 'Global',
    scope: 'global',
    when: () => false,
    run: () => undefined,
  },
  {
    id: 'export-dialog',
    keys: 'mod+shift+e',
    label: 'Export',
    group: 'Global',
    scope: 'global',
    keywords: ['code', 'react', 'download', 'zip'],
    run: ({ store }) => {
      store.getState().setExportDialogOpen(true)
    },
  },
  {
    id: 'settings',
    keys: 'mod+,',
    label: 'Settings',
    group: 'Global',
    scope: 'global',
    when: () => false,
    run: ({ store }) => {
      store.getState().setActiveDialog('settings')
    },
  },
  {
    id: 'shortcut-sheet',
    keys: 'mod+/',
    label: 'Keyboard shortcuts',
    group: 'Global',
    scope: 'global',
    keywords: ['keys', 'reference', 'help'],
    run: ({ store }) => {
      store.getState().setActiveDialog('shortcuts')
    },
  },
  {
    id: 'toggle-left-panel',
    keys: 'mod+\\',
    label: 'Toggle left panel',
    group: 'Global',
    scope: 'global',
    when: hasPanels,
    run: ({ panels }) => panels?.toggle('left'),
  },
  {
    id: 'toggle-inspector',
    keys: 'mod+alt+\\',
    label: 'Toggle inspector',
    group: 'Global',
    scope: 'global',
    when: hasPanels,
    run: ({ panels }) => panels?.toggle('right'),
  },
  {
    id: 'presentation-mode',
    keys: 'mod+.',
    label: 'Toggle both panels',
    group: 'Global',
    scope: 'global',
    keywords: ['presentation', 'focus'],
    when: hasPanels,
    run: ({ panels }) => {
      if (panels === null) {
        return
      }

      // Both go the same way: if either is open, this closes the pair.
      const closing = panels.isOpen('left') || panels.isOpen('right')

      if (panels.isOpen('left') === closing) {
        panels.toggle('left')
      }

      if (panels.isOpen('right') === closing) {
        panels.toggle('right')
      }
    },
  },
  {
    id: 'cycle-focus',
    keys: 'f2',
    label: 'Cycle focus: canvas → left → inspector',
    group: 'Global',
    scope: 'global',
    // The focus scopes are the shell's own (prompt 11) and it cycles them from its own handler.
    delegated: true,
    run: () => undefined,
  },
  {
    id: 'escape',
    keys: 'escape',
    label: 'Close overlay, exit isolation, clear selection',
    group: 'Global',
    scope: 'global',
    run: ({ store }) => {
      const state = store.getState()

      if (state.ui.commandPaletteOpen) {
        state.setCommandPaletteOpen(false)

        return
      }

      if (state.ui.activeDialog !== null) {
        state.setActiveDialog(null)

        return
      }

      // Radix closes the export dialog itself; this stops the same press also clearing the canvas
      // selection behind it, which is a surprise nobody asked Escape for.
      if (state.ui.exportDialogOpen) {
        state.setExportDialogOpen(false)

        return
      }

      if (state.selection.isolationId !== null) {
        state.exitNode()

        return
      }

      state.clearSelection()
    },
  },
]
