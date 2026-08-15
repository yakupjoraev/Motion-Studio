'use client'

import { commands, selectors } from '@motion-studio/editor'
import type { NodeId } from '@motion-studio/schema'
import { useCallback } from 'react'

import { useStudioStore } from '../../../../store/editor-store'

export interface LayerRenameHandle {
  /** The row showing an input, from the store: the canvas and the tree must not disagree about it. */
  readonly editingId: NodeId | null
  begin(id: NodeId): void
  commit(id: NodeId, name: string): void
  cancel(): void
}

/**
 * The inline rename. Committing an unchanged or blank name is not a command — an undo step that
 * restores the name it already had is noise in the history, and `nodeSchema` refuses a blank one.
 */
export function useLayerRename(): LayerRenameHandle {
  const editingId = useStudioStore(selectors.selectEditingId)

  const begin = useCallback((id: NodeId) => {
    useStudioStore.getState().setEditing(id)
  }, [])

  const cancel = useCallback(() => {
    useStudioStore.getState().setEditing(null)
  }, [])

  const commit = useCallback((id: NodeId, name: string) => {
    const state = useStudioStore.getState()
    const next = name.trim()

    state.setEditing(null)

    if (next === '' || next === state.document.nodes[id]?.name) {
      return
    }

    state.dispatch(commands.renameNode({ nodeId: id, name: next }))
  }, [])

  return { editingId, begin, cancel, commit }
}
