'use client'

import { type EditorStore, commands, createEditorStore } from '@motion-studio/editor'

import { describeBatch, describeCommand } from '../lib/errors/describe-command'
import { recordCommand } from '../lib/errors/error-context'
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

/**
 * The command half of the error context — `prompts/58` § Error report.
 *
 * Wrapped here rather than inside the store for the same reason the store is built here: naming the
 * command a crash report should quote is a question about this application, and `packages/editor`
 * must stay a library that a host without an error reporter can use.
 *
 * Recorded **before** the command runs, so the command that threw is the one the report names.
 */
function recordDispatchedCommands(store: EditorStore): void {
  const { dispatch, dispatchBatch } = store.getState()

  store.setState({
    dispatch(command) {
      recordCommand(describeCommand(command))
      dispatch(command)
    },
    dispatchBatch(batch, label, coalesceKey) {
      recordCommand(describeBatch(batch))
      dispatchBatch(batch, label, coalesceKey)
    },
  })
}

recordDispatchedCommands(useStudioStore)

// A handle for the browser console and for the perf specs, which script edits through it. Both
// operands are build-time constants, so an ordinary production build has no such global — ADR-315.
//
// The cast is the one contract § 1.1 permits: `window` does not declare `studio` and should not, so
// this describes a host global rather than laundering a type of ours (ADR-348).
if (
  (process.env.NODE_ENV !== 'production' || process.env.MS_INSTRUMENT === '1') &&
  typeof window !== 'undefined'
) {
  ;(window as unknown as { studio?: unknown }).studio = { store: useStudioStore, commands }
}
