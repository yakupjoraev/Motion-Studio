'use client'

import { applyTheme, markThemeReady, studioDark } from '@motion-studio/theme'
import { useEffect } from 'react'

/**
 * Applies the default theme once, on mount, and opens the transition gate a frame later so the initial
 * variable write has nothing to animate from — `THEME_ENGINE.md` § Colour mode.
 *
 * Renders nothing: a theme change is a `style.setProperty` loop on the root, never a React render. The
 * studio shell takes this over in prompt 11, along with the mode toggle and the theme builder.
 */
export function ThemeBoot() {
  useEffect(() => {
    applyTheme(studioDark)
    markThemeReady()
  }, [])

  return null
}
