import { applyThemePreset } from '../../commands/apply-theme-preset'
import { setThemeToken } from '../../commands/set-theme-token'
import type { ThemeSlice } from '../store.types'

import type { SliceCreator } from './slice.types'

/**
 * The theme is `document.theme` — it exports with the document — so every setter here is a dispatch
 * and every edit is undoable. The slice holds no config of its own: a copy beside the document is the
 * derived-data anti-pattern, and reads go through `selectTheme` — ADR-053.
 *
 * The CSS-variable half of "instant feedback" is not here and cannot be: this package has no DOM. The
 * theme builder writes the variables with `applyThemePartial` and calls these on commit —
 * THEME_ENGINE.md § Theme builder UI.
 */
export const createThemeSlice: () => SliceCreator<ThemeSlice> = () => (_set, get) => ({
  setThemeToken(path, value) {
    get().dispatch(setThemeToken({ path, value }))
  },

  /** Colour mode is one token among the others: `ThemeConfig.colorMode`, and it exports with the file. */
  setColorMode(mode) {
    get().dispatch(setThemeToken({ path: 'colorMode', value: mode }))
  },

  applyThemePreset(id) {
    get().dispatch(applyThemePreset({ id }))
  },
})
