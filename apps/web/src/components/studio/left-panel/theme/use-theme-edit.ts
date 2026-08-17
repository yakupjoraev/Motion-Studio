'use client'

import type { ThemeConfig } from '@motion-studio/theme'
import { clone, getPath, setPath } from '@motion-studio/utils'
import { useCallback, useMemo } from 'react'

import { useStudioStore } from '../../../../store/editor-store'

import { writeThemeChange } from './theme-variables'

/**
 * Every theme control edits through this hook, and every control does the same two things —
 * `THEME_ENGINE.md` § Theme builder UI:
 *
 * 1. `preview` writes the affected CSS variables now. No store write, so no React render: dragging the
 *    hue slider recolours the whole document without the panel, the canvas or the blocks re-rendering.
 * 2. `commit` dispatches `setThemeToken`, whose coalesce key is `theme:{path}` — a hundred commits
 *    inside the history window are one undo step.
 *
 * `preview` reads the config from the store rather than from a render, because a drag produces frames
 * faster than React produces renders and the previous frame's value must not be the baseline.
 */

export interface ThemeEdit {
  /** The document's theme, for the controls to display. */
  readonly config: ThemeConfig
  /** Per frame during a gesture. Variables only. */
  readonly preview: (path: string, value: unknown) => void
  /** Once, on release. */
  readonly commit: (path: string, value: unknown) => void
  /**
   * Both halves at once, for a control with no gesture to preview — a segmented group, a select. The
   * variables are still written first, so the document repaints from the click rather than from the
   * store round-trip.
   */
  readonly set: (path: string, value: unknown) => void
}

const withValue = (config: ThemeConfig, path: string, value: unknown): ThemeConfig => {
  const next = clone(config)

  setPath(next, path, value)

  return next
}

export function useThemeEdit(): ThemeEdit {
  const config = useStudioStore((state) => state.document.theme)

  /*
   * Synchronous, and measured to be the right shape: batching the writes into a `requestAnimationFrame`
   * — the usual treatment for a high-frequency value — changed nothing on a five-second hue drag
   * (median 16.7 ms, p95 33.2 ms either way). The frames a palette drag drops are the browser's style
   * recalculation and paint, not repeated writes, so the frame loop would be machinery with no effect.
   */
  const preview = useCallback((path: string, value: unknown) => {
    const current = useStudioStore.getState().document.theme

    if (getPath(current, path) === value) {
      return
    }

    writeThemeChange(current, withValue(current, path, value))
  }, [])

  const commit = useCallback((path: string, value: unknown) => {
    const state = useStudioStore.getState()

    if (getPath(state.document.theme, path) === value) {
      return
    }

    state.setThemeToken(path, value)
  }, [])

  const set = useCallback(
    (path: string, value: unknown) => {
      preview(path, value)
      commit(path, value)
    },
    [preview, commit],
  )

  return useMemo(() => ({ config, preview, commit, set }), [config, preview, commit, set])
}
