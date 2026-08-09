import type { Command } from '../../commands/command.types'
import { applyCommands } from '../../commands/dispatch'
import { pruneSelection } from '../../history/prune-selection'
import type { DocumentSlice } from '../store.types'

import type { ResolvedOptions, SliceCreator } from './slice.types'

export const createDocumentSlice =
  ({ context, initialDocument }: ResolvedOptions): SliceCreator<DocumentSlice> =>
  (set, get) => {
    /**
     * STATE_MANAGEMENT.md § Dispatch. One commit path for one command and for a batch, because the
     * three things that must happen together — the new document, the version bump, the dirty flag —
     * are easier to keep together than to keep in sync.
     */
    const commit = (
      commands: readonly Command[],
      label: string,
      coalesceKey: string | null,
      action: string,
    ): void => {
      const state = get()
      const outcome = applyCommands(state.document, commands, context)

      // Zero patches means the command changed nothing: clicking the already-active alignment button
      // must not create an undo step.
      if (outcome === null) {
        return
      }

      set({ document: outcome.document, version: state.version + 1, dirty: true }, false, action)

      get().recordHistory({
        label,
        patches: outcome.patches,
        inversePatches: outcome.inversePatches,
        coalesceKey,
        selectionBefore: state.selection.ids,
      })
    }

    return {
      document: initialDocument,
      version: 0,
      dirty: false,

      dispatch(command) {
        commit([command], command.label, command.coalesceKey ?? null, `dispatch/${command.type}`)
      },

      /**
       * One history entry for the whole list, so a paste of five blocks is one undo step — and, with
       * a key, one entry for a batch that repeats: an inspector drag over a multi-selection commits
       * thirty times a second and is one edit (ADR-113).
       */
      dispatchBatch(commands, label, coalesceKey) {
        commit(commands, label, coalesceKey ?? null, 'dispatchBatch')
      },

      replaceDocument(next) {
        const state = get()

        set(
          {
            document: next,
            version: state.version + 1,
            // A loaded document has nothing unsaved. The first command sets this back to `true`.
            dirty: false,
            selection: pruneSelection(state.selection, next),
          },
          false,
          'replaceDocument',
        )

        get().clearHistory()
      },
    }
  }
