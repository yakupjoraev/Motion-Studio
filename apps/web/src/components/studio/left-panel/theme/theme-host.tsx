'use client'

import { applyTheme } from '@motion-studio/theme'
import { useEffect } from 'react'

import { useStudioStore } from '../../../../store/editor-store'

/**
 * Applies `document.theme` to the root, and keeps applying it — ADR-172. Until this existed a theme
 * command changed the document without changing a single pixel: nothing in the studio read the
 * document's theme.
 *
 * The subscription is the store's own, not `useStudioStore(selector)`, and that is the point:
 * `THEME_ENGINE.md` § Rules, 5 requires a theme change to trigger no React render at all, and a hook
 * would render this component on every edit — thirty times a second during a drag.
 *
 * `system` follows the OS through the same path: the media query fires, and the config resolves again
 * against the new environment mode.
 */
export function ThemeHost() {
  useEffect(() => {
    applyTheme(useStudioStore.getState().document.theme)

    const unsubscribe = useStudioStore.subscribe((state, previous) => {
      if (state.document.theme !== previous.document.theme) {
        applyTheme(state.document.theme)
      }
    })

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onPreferenceChange = (): void => {
      if (useStudioStore.getState().document.theme.colorMode === 'system') {
        applyTheme(useStudioStore.getState().document.theme)
      }
    }

    media.addEventListener('change', onPreferenceChange)

    return () => {
      unsubscribe()
      media.removeEventListener('change', onPreferenceChange)
    }
  }, [])

  return null
}
