'use client'

import { applyTheme, markThemeReady, storedColorMode, studioDark } from '@motion-studio/theme'
import { useEffect } from 'react'

/**
 * Applies the default theme once, on mount, and opens the transition gate a frame later so the initial
 * variable write has nothing to animate from — `THEME_ENGINE.md` § Colour mode.
 *
 * The stored preference wins over the preset's own mode: `studioDark` says `dark`, and applying that
 * unconditionally overrode the choice the mode script had just read from storage — ADR-322.
 */
export function ThemeBoot() {
  useEffect(() => {
    const stored = storedColorMode()

    applyTheme(stored === undefined ? studioDark : { ...studioDark, colorMode: stored })
    markThemeReady()
  }, [])

  return null
}
