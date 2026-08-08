import type { Node, NodeId } from '@motion-studio/schema'

import type { EditorState, SelectionState } from '../store/store.types'

import { createVersionedSelector } from './create-versioned-selector'

// Reference-stable: `selection` and its `ids` array are replaced only when the selection changes.
export const selectSelection = (state: EditorState): SelectionState => state.selection
export const selectSelectionIds = (state: EditorState): readonly NodeId[] => state.selection.ids
export const selectAnchorId = (state: EditorState): NodeId | null => state.selection.anchorId
export const selectHoverId = (state: EditorState): NodeId | null => state.selection.hoverId
export const selectEditingId = (state: EditorState): NodeId | null => state.selection.editingId
export const selectIsolationId = (state: EditorState): NodeId | null => state.selection.isolationId

export const selectHasSelection = (state: EditorState): boolean => state.selection.ids.length > 0

/** The inspector's subject: a single selection, or `null` for none and for a multi-selection. */
export const selectSoleSelectedId = (state: EditorState): NodeId | null =>
  state.selection.ids.length === 1 ? (state.selection.ids[0] ?? null) : null

export const selectIsSelected =
  (id: NodeId) =>
  (state: EditorState): boolean =>
    state.selection.ids.includes(id)

/** Allocates, so it is memoised on the two things it reads. */
export const selectSelectedNodes = createVersionedSelector<EditorState, readonly Node[]>(
  (state) => [state.document, state.selection.ids],
  (state) =>
    state.selection.ids.flatMap((id) => {
      const node = state.document.nodes[id]

      return node === undefined ? [] : [node]
    }),
)
