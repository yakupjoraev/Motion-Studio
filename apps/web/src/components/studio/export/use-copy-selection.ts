'use client'

import { DEFAULT_EXPORT_OPTIONS } from '@motion-studio/codegen/options'
import type { EditorStore } from '@motion-studio/editor'
import { type ToastOptions, useToast } from '@motion-studio/ui'
import { useCallback } from 'react'

import { useStudioStore } from '../../../store/editor-store'

export type Notify = (options: ToastOptions) => void

/**
 * Copy React, from the context menu and from `Mod+Shift+C` — the same `run-export` calls the dialog
 * makes, with `scope: 'selection'`. One code path, which is what stops the button drifting from the
 * dialog it copies from (EXPORT_ENGINE.md § Options).
 *
 * It copies one component because it answers one question: the subtree the user selected. The barrel
 * and any shared module belong to an export and not to a clipboard.
 */
export async function copySelection(store: EditorStore, notify: Notify | null): Promise<void> {
  const state = store.getState()
  const [first] = state.selection.ids

  if (first === undefined) {
    return
  }

  try {
    const engine = await import('./run-export')
    const file = await engine.copyEntry({
      document: state.document,
      options: { ...DEFAULT_EXPORT_OPTIONS, scope: 'selection' },
      selection: first,
    })

    await navigator.clipboard.writeText(file.contents)
    notify?.({ title: `Copied ${file.path}` })
  } catch (error) {
    notify?.({
      title: 'Copy React failed',
      description: error instanceof Error ? error.message : String(error),
      tone: 'danger',
    })
  }
}

/** The hook the canvas ports use. Stable, because the toast publisher is. */
export function useCopySelection(): () => void {
  const notify = useToast()

  return useCallback(() => {
    void copySelection(useStudioStore, notify)
  }, [notify])
}
