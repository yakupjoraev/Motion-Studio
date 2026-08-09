'use client'

import { blockRegistry } from '@motion-studio/blocks'
import { type EditorStore, commands, createEditorStore } from '@motion-studio/editor'

/**
 * ADR-102. The composition root: the registry a store validates against is fixed when the store is
 * built, so the studio's store is built here — where both halves of the seam are in scope — rather
 * than in `packages/editor`, which must not import `packages/blocks`.
 */
export const useStudioStore: EditorStore = createEditorStore({
  registry: blockRegistry,
  now: () => Date.now(),
})

// A handle for the browser console in development: the store and the command factories, which is
// what a walkthrough needs to build a document before there is a palette to drag from. The
// assignment is guarded, so production has no such global.
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  ;(window as unknown as { studio?: unknown }).studio = { store: useStudioStore, commands }
}
