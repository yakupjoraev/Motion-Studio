import type { LeftTab } from '@motion-studio/editor'

import type { StudioShortcut } from './shortcut.types'

const TABS: readonly { readonly tab: LeftTab; readonly label: string }[] = [
  { tab: 'blocks', label: 'Blocks' },
  { tab: 'motion', label: 'Motion' },
  { tab: 'effects', label: 'Effects' },
  { tab: 'theme', label: 'Theme' },
  { tab: 'layers', label: 'Layers' },
]

/** SHORTCUTS.md § Panels. */
export const PANEL_SHORTCUTS: readonly StudioShortcut[] = [
  ...TABS.map(
    ({ tab, label }, index): StudioShortcut => ({
      id: `panel-${tab}`,
      keys: `alt+${index + 1}`,
      label: `Panel: ${label}`,
      group: 'Panels',
      scope: 'global',
      keywords: ['tab', 'panel', tab],
      run: ({ store }) => {
        const state = store.getState()

        if (state.ui.leftPanel.collapsed) {
          state.togglePanel('left')
        }

        state.setLeftTab(tab)
      },
    }),
  ),
  {
    id: 'focus-block-search',
    keys: 'mod+f',
    label: 'Focus block search',
    group: 'Panels',
    scope: 'global',
    // The blocks palette is prompt 37; it owns the field this would focus.
    when: () => false,
    run: () => undefined,
  },
  {
    id: 'focus-layer-search',
    keys: 'mod+shift+f',
    label: 'Focus layer search',
    group: 'Panels',
    scope: 'global',
    run: ({ store }) => {
      const state = store.getState()

      if (state.ui.leftPanel.collapsed) {
        state.togglePanel('left')
      }

      state.setLeftTab('layers')

      // The panel is a lazy chunk, so the field may not exist yet: focusing it on the next frame,
      // by its accessible name, keeps the binding independent of when that chunk arrives.
      requestAnimationFrame(() => {
        document.querySelector<HTMLInputElement>('input[aria-label="Search layers"]')?.focus()
      })
    },
  },
]
