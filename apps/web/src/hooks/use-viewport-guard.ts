'use client'

import { useEffect, useState } from 'react'

/**
 * UI_GUIDELINES.md § Responsiveness of the chrome, as three named widths.
 *
 * `wide` — panels are grid columns. `overlay` — panels float over the canvas, opened from the top
 * bar. `narrow` — the studio says it needs a wider screen and points at the gallery.
 */
export type ViewportMode = 'wide' | 'overlay' | 'narrow'

/** The same two numbers the stylesheet uses — ADR-050 says why they are written twice. */
export const VIEWPORT_QUERY = {
  wide: '(min-width: 1280px)',
  overlay: '(min-width: 1024px)',
} as const

/**
 * `wide` before hydration, because the server cannot measure a viewport. That is deliberate and it is
 * invisible: the layout itself comes from media queries, so the first paint is already right at every
 * width. This hook drives behaviour only — which state a shortcut toggles, and whether the chrome is
 * inert — and behaviour has no first paint to get wrong.
 */
export function useViewportGuard(): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>('wide')

  useEffect(() => {
    const wide = window.matchMedia(VIEWPORT_QUERY.wide)
    const overlay = window.matchMedia(VIEWPORT_QUERY.overlay)

    const read = (): void => {
      setMode(wide.matches ? 'wide' : overlay.matches ? 'overlay' : 'narrow')
    }

    read()
    wide.addEventListener('change', read)
    overlay.addEventListener('change', read)

    return () => {
      wide.removeEventListener('change', read)
      overlay.removeEventListener('change', read)
    }
  }, [])

  return mode
}
