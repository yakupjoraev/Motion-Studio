'use client'

import { useEffect } from 'react'

import { useStudioStore } from '../store/editor-store'

export const SECTIONS_KEY = 'motion-studio.inspector.sections'

const read = (): Record<string, boolean> => {
  try {
    const raw = window.localStorage.getItem(SECTIONS_KEY)
    const parsed: unknown = raw === null ? null : JSON.parse(raw)

    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, boolean>) : {}
  } catch {
    // A quota error or a private window is not a reason to fail to open the studio.
    return {}
  }
}

/**
 * ADR-114. Which inspector sections are open is chrome state, not document state: it belongs to the
 * browser the user is sitting at rather than to the `.motion` file, so it goes to `localStorage` and
 * not through the document persistence prompt 50 builds.
 */
export function usePersistedSections(): void {
  useEffect(() => {
    const stored = read()

    for (const [id, open] of Object.entries(stored)) {
      if (typeof open === 'boolean') {
        useStudioStore.getState().setSectionOpen(id, open)
      }
    }

    return useStudioStore.subscribe((state, previous) => {
      if (state.ui.rightPanel.openSections === previous.ui.rightPanel.openSections) {
        return
      }

      try {
        window.localStorage.setItem(SECTIONS_KEY, JSON.stringify(state.ui.rightPanel.openSections))
      } catch {
        // Same reason: the panel still works, it just forgets.
      }
    })
  }, [])
}
