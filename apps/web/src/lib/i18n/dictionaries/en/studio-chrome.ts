import type { PluralForms } from '../../plural'

/** The frame around the canvas: the top bar, the two menus, the status bar and the shell itself. */
export const studioChrome = {
  metaTitle: 'Studio · Motion Studio',
  metaDescription: 'The editor: canvas, inspector, motion, export.',
  brand: 'Motion Studio',
  loading: 'Opening the studio…',

  toggleLeftPanel: 'Toggle left panel',
  toggleInspector: 'Toggle inspector',
  commandPalette: 'Command palette',
  undo: 'Undo',
  redo: 'Redo',
  zoom: 'Zoom',
  breakpoint: 'Breakpoint',
  playground: 'Playground',
  export: 'Export',

  leftPanel: 'Left panel',
  leftPanelWidth: 'Left panel width',
  canvas: 'Canvas',
  inspector: 'Inspector',
  inspectorWidth: 'Inspector width',
  tooNarrow: 'Motion Studio needs a wider screen.',
  browseGallery: 'Browse the block gallery instead →',

  fileMenu: 'File',
  fileNew: 'New',
  fileOpen: 'Open',
  fileSave: 'Download a copy',
  fileSaveAs: 'Save as',
  fileImport: 'Import a document',
  fileVersionHistory: 'Version history',
  fileRecent: 'Recent',
  fileNoRecent: 'No other documents',
  /** `{name}` is the document that would not open. */
  fileOpenFailed: 'Could not open {name}',
  /** `{count}` blocks in a recent document. */
  fileRecentBlocks: { one: '{count} block', other: '{count} blocks' } as PluralForms,

  editMenu: 'Edit',
  editUndo: 'Undo',
  editRedo: 'Redo',
  editDuplicate: 'Duplicate',
  editDelete: 'Delete',
  editSelectAll: 'Select all',

  statusNodes: { one: '{count} node', other: '{count} nodes' } as PluralForms,
  statusNoSelection: 'No selection',
  /** `{name}` is the block's own name. */
  statusOneSelected: '{name} selected',
  statusManySelected: { one: '{count} selected', other: '{count} selected' } as PluralForms,
  statusBlockFallback: 'Block',
  statusFrameRate: 'Frame rate meter',
  statusFps: 'fps',
  /** `{count}` glass surfaces against the `{cap}` the design system allows. */
  statusGlassOverCap: '{count} glass surfaces — over the cap of {cap}',
  statusMotionPaused: 'Motion paused',
  statusUnsaved: 'Unsaved changes',
  statusSaved: 'Saved',
  statusOn: 'on',
  statusOff: 'off',
  statusReducedMotion: 'Reduced motion:',

  paletteTitle: 'Command palette',
  paletteDescription: 'Search every command, block, preset, theme and layer.',
  palettePlaceholder: 'Type a command…',
  paletteSearchLabel: 'Search commands',
  paletteListLabel: 'Commands',
  /** `{query}` is what was typed. */
  paletteEmpty: 'Nothing matches “{query}”.',

  shortcutsTitle: 'Keyboard shortcuts',
  shortcutsDescription:
    'Every shortcut the studio knows, generated from the registry that runs them.',
  shortcutsSearch: 'Search shortcuts',
  shortcutsSearchPlaceholder: 'undo, breakpoint, pan…',
  /** `{query}` is what was typed into the sheet's search. */
  shortcutsEmpty: 'No shortcut matches “{query}”.',
  /**
   * Shortcut labels and their groups, keyed by the English string the registry holds — the same
   * scheme ADR-365 chose for the block registry, and for the same reason: `studio-registry.test.ts`
   * checks those strings against `docs/SHORTCUTS.md`, so they stay English where they are declared.
   *
   * Empty in English: the registry's own string is the English one.
   */
  /** `{name}` is the block, the preset or the layer the command acts on. */
  paletteInsert: 'Insert {name}',
  paletteAdd: 'Add {name}',
  paletteApply: 'Apply {name}',
  paletteTheme: 'Theme: {name}',
  paletteSelect: 'Select {name}',
  paletteGroups: {
    Insert: 'Insert',
    Motion: 'Motion',
    Effects: 'Effects',
    Edit: 'Edit',
    View: 'View',
    Theme: 'Theme',
    Layer: 'Layer',
    Document: 'Document',
    Help: 'Help',
  } as Readonly<Record<string, string>>,
  shortcutLabels: {} as Readonly<Record<string, string>>,
  shortcutGroups: {} as Readonly<Record<string, string>>,
}
