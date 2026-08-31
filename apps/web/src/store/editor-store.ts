'use client'

import { type EditorStore, commands, createEditorStore } from '@motion-studio/editor'

import { deferredBlockRegistry } from './block-registry'

/**
 * ADR-102. The composition root: the registry a store validates against is fixed when the store is
 * built, so the studio's store is built here — where both halves of the seam are in scope — rather
 * than in `packages/editor`, which must not import `packages/blocks`.
 *
 * What is fixed is the *instance*, not its contents: ADR-312 fills it from a chunk that arrives after
 * the shell paints, because 69.4 kB of definitions in the first load is what put `/studio` 120 kB over
 * its budget.
 */
export const useStudioStore: EditorStore = createEditorStore({
  registry: deferredBlockRegistry,
  now: () => Date.now(),
})

// A handle for the browser console in development: the store and the command factories, which is
// what a walkthrough needs to build a document before there is a palette to drag from. The
// assignment is guarded, so production has no such global.
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  ;(window as unknown as { studio?: unknown }).studio = { store: useStudioStore, commands }
}
