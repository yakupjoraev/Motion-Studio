import type { MotionDocument, NodeId } from '@motion-studio/schema'

import { normalizeSelection } from '../store/slices/selection-slice'
import type { SelectionState } from '../store/store.types'

/**
 * Filters a whole selection against a document. Undo removes nodes that may still be selected, and
 * every other field holds an id too — a stale `isolationId` isolates a container that no longer
 * exists, which hides the entire canvas.
 */
export function pruneSelection(
  selection: SelectionState,
  document: MotionDocument,
): SelectionState {
  const exists = (id: NodeId | null): NodeId | null =>
    id !== null && document.nodes[id] !== undefined ? id : null

  return {
    ids: normalizeSelection(document, selection.ids),
    anchorId: exists(selection.anchorId),
    editingId: exists(selection.editingId),
    hoverId: exists(selection.hoverId),
    isolationId: exists(selection.isolationId),
  }
}
