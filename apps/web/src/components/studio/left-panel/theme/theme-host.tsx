'use client'

import { applyTheme } from '@motion-studio/theme'
import { useEffect } from 'react'

import { useStudioStore } from '../../../../store/editor-store'

import { watchThemeTargets } from './theme-targets'

/**
 * Applies `document.theme` to every artboard, and keeps applying it — ADR-172, retargeted by
 * ADR-404. Until ADR-172 existed a theme command changed the document without changing a single
 * pixel; until ADR-404 it changed every pixel, including the chrome the user had set to light.
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
    let targets: readonly HTMLElement[] = []

    const paint = (): void => {
      const theme = useStudioStore.getState().document.theme

      for (const root of targets) {
        applyTheme(theme, { root })
      }
    }

    const stopWatching = watchThemeTargets((next) => {
      targets = next
      paint()
    })

    const unsubscribe = useStudioStore.subscribe((state, previous) => {
      if (state.document.theme !== previous.document.theme) {
        paint()
      }
    })

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onPreferenceChange = (): void => {
      if (useStudioStore.getState().document.theme.colorMode === 'system') {
        paint()
      }
    }

    media.addEventListener('change', onPreferenceChange)

    return () => {
      stopWatching()
      unsubscribe()
      media.removeEventListener('change', onPreferenceChange)
    }
  }, [])

  return null
}
