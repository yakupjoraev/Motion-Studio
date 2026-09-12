'use client'

import { useEffect } from 'react'

import { useStudioStore } from '../store/editor-store'

export const CODE_PANEL_KEY = 'motion-studio.code-panel.open'

const read = (): boolean => {
  try {
    return window.localStorage.getItem(CODE_PANEL_KEY) === 'true'
  } catch {
    // A private window is not a reason to fail to open the studio — the panel just forgets.
    return false
  }
}

/**
 * Whether the code panel is open is chrome state, like the inspector's open sections (ADR-114): it
 * belongs to the browser the user is sitting at rather than to the `.motion` file.
 *
 * The default is closed and it is closed on the first visit, which is the owner's condition in
 * `prompts/68` — a person composing a page never has to look at the code.
 */
export function usePersistedCodePanel(): void {
  useEffect(() => {
    if (read()) {
      useStudioStore.getState().setCodePanelOpen(true)
    }

    return useStudioStore.subscribe((state, previous) => {
      if (state.ui.codePanelOpen === previous.ui.codePanelOpen) {
        return
      }

      try {
        window.localStorage.setItem(CODE_PANEL_KEY, String(state.ui.codePanelOpen))
      } catch {
        // Same reason: it works, it just forgets.
      }
    })
  }, [])
}
