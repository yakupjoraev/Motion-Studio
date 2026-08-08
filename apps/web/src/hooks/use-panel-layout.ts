'use client'

import { clamp } from '@motion-studio/utils'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  DEFAULT_PANEL_LAYOUT,
  PANEL_BOUNDS,
  PANEL_LAYOUT_KEY,
  type PanelLayout,
  type PanelSide,
  paintPanelLayout,
  parsePanelLayout,
} from './panel-layout'

/** § Persisted layout. Long enough that a drag writes once, short enough to survive a fast reload. */
const PERSIST_DELAY = 500

export interface PanelLayoutApi {
  readonly layout: PanelLayout
  /** Once per commit — the end of a drag, or one arrow press. */
  readonly setWidth: (side: PanelSide, width: number) => void
  readonly toggleCollapsed: (side: PanelSide) => void
}

/**
 * Owns the two panel widths and their collapse states, and writes them where the grid reads them.
 *
 * Nothing here synchronises state into the DOM after the fact: the boot script paints the restored
 * widths, and every mutation below paints its own. A state-to-DOM effect would run once with the
 * defaults before the restore landed, which is the flash the boot script exists to prevent.
 */
export function usePanelLayout(): PanelLayoutApi {
  const [layout, setLayout] = useState<PanelLayout>(DEFAULT_PANEL_LAYOUT)
  /** The same value, readable inside a callback without listing it as a dependency. */
  const layoutRef = useRef<PanelLayout>(DEFAULT_PANEL_LAYOUT)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The DOM already carries these values. This is React catching up, so the handle can report them.
  useEffect(() => {
    let stored: string | null = null

    try {
      stored = window.localStorage.getItem(PANEL_LAYOUT_KEY)
    } catch {
      return
    }

    const restored = parsePanelLayout(stored)

    layoutRef.current = restored
    setLayout(restored)
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    },
    [],
  )

  const persist = useCallback((next: PanelLayout): void => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify(next))
      } catch {
        // A storage quota or a private window costs the user a persisted width, not a session.
      }
    }, PERSIST_DELAY)
  }, [])

  /** One place where a new layout becomes the DOM's, the store's, and React's — in that order. */
  const commit = useCallback(
    (side: PanelSide, next: PanelLayout): void => {
      layoutRef.current = next
      paintPanelLayout(side, next)
      persist(next)
      setLayout(next)
    },
    [persist],
  )

  const setWidth = useCallback(
    (side: PanelSide, width: number): void => {
      const bounds = PANEL_BOUNDS[side]
      const clamped = clamp(width, bounds.min, bounds.max)
      const current = layoutRef.current

      commit(side, side === 'left' ? { ...current, left: clamped } : { ...current, right: clamped })
    },
    [commit],
  )

  const toggleCollapsed = useCallback(
    (side: PanelSide): void => {
      const current = layoutRef.current

      commit(
        side,
        side === 'left'
          ? { ...current, leftCollapsed: !current.leftCollapsed }
          : { ...current, rightCollapsed: !current.rightCollapsed },
      )
    },
    [commit],
  )

  return { layout, setWidth, toggleCollapsed }
}
