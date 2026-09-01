import { clamp } from '@motion-studio/utils'

import type { PanelSide, UiSlice, UiState } from '../store.types'

import type { SliceCreator } from './slice.types'

/** UI_GUIDELINES.md § Layout: left 240–360 default 280, right 280–420 default 320. */
export const PANEL_BOUNDS = {
  left: { min: 240, max: 360, initial: 280 },
  right: { min: 280, max: 420, initial: 320 },
} as const satisfies Record<PanelSide, { min: number; max: number; initial: number }>

export const INITIAL_UI: UiState = {
  leftPanel: { tab: 'blocks', width: PANEL_BOUNDS.left.initial, collapsed: false },
  rightPanel: { width: PANEL_BOUNDS.right.initial, collapsed: false, openSections: {} },
  commandPaletteOpen: false,
  exportDialogOpen: false,
  activeDialog: null,
  /** PRODUCT.md § 1: on in development, behind the status-bar toggle in production. */
  fpsVisible: process.env['NODE_ENV'] === 'development',
}

/** Panel state is persisted to `localStorage` and is not undoable — STATE_MANAGEMENT.md § ui. */
export const createUiSlice: () => SliceCreator<UiSlice> = () => (set, get) => ({
  ui: INITIAL_UI,

  setLeftTab(tab) {
    const { ui } = get()

    set({ ui: { ...ui, leftPanel: { ...ui.leftPanel, tab } } }, false, `setLeftTab/${tab}`)
  },

  /** Clamped here rather than at the drag handle: a width out of bounds is invalid in storage too. */
  setPanelWidth(side, width) {
    const { ui } = get()
    const bounds = PANEL_BOUNDS[side]
    const next = clamp(width, bounds.min, bounds.max)

    set(
      side === 'left'
        ? { ui: { ...ui, leftPanel: { ...ui.leftPanel, width: next } } }
        : { ui: { ...ui, rightPanel: { ...ui.rightPanel, width: next } } },
      false,
      `setPanelWidth/${side}`,
    )
  },

  togglePanel(side) {
    const { ui } = get()

    set(
      side === 'left'
        ? { ui: { ...ui, leftPanel: { ...ui.leftPanel, collapsed: !ui.leftPanel.collapsed } } }
        : { ui: { ...ui, rightPanel: { ...ui.rightPanel, collapsed: !ui.rightPanel.collapsed } } },
      false,
      `togglePanel/${side}`,
    )
  },

  setSectionOpen(section, open) {
    const { ui } = get()

    set(
      {
        ui: {
          ...ui,
          rightPanel: {
            ...ui.rightPanel,
            openSections: { ...ui.rightPanel.openSections, [section]: open },
          },
        },
      },
      false,
      'setSectionOpen',
    )
  },

  setCommandPaletteOpen(open) {
    set({ ui: { ...get().ui, commandPaletteOpen: open } }, false, 'setCommandPaletteOpen')
  },

  setExportDialogOpen(open) {
    set({ ui: { ...get().ui, exportDialogOpen: open } }, false, 'setExportDialogOpen')
  },

  setActiveDialog(dialog) {
    set({ ui: { ...get().ui, activeDialog: dialog } }, false, 'setActiveDialog')
  },

  setFpsVisible(visible) {
    set({ ui: { ...get().ui, fpsVisible: visible } }, false, 'setFpsVisible')
  },
})
