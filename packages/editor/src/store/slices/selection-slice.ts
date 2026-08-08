import { type MotionDocument, type NodeId, ancestors, walk } from '@motion-studio/schema'

import type { SelectionSlice, SelectionState } from '../store.types'

import type { SliceCreator } from './slice.types'

export const EMPTY_SELECTION: SelectionState = {
  ids: [],
  anchorId: null,
  editingId: null,
  hoverId: null,
  isolationId: null,
}

/**
 * EDITOR_ENGINE.md § Normalization. Selecting a node **and** its descendant is ambiguous — a move
 * would move the child twice — so a node with an ancestor in the set is dropped. The survivors come
 * back in document order, which is what makes align, distribute and copy behave predictably.
 *
 * Walking the document rather than sorting the request does three jobs at once: the result is in
 * document order by construction, duplicates collapse, and an id the document does not contain is
 * never reached — and an id that survives into `selection.ids` crashes the inspector later.
 */
export function normalizeSelection(
  document: MotionDocument,
  ids: readonly NodeId[],
): readonly NodeId[] {
  const requested = new Set(ids)
  const kept: NodeId[] = []

  for (const node of walk(document)) {
    if (!requested.has(node.id)) {
      continue
    }

    if (ancestors(document, node.id).some((ancestor) => requested.has(ancestor.id))) {
      continue
    }

    kept.push(node.id)
  }

  return kept
}

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

const siblingsOf = (document: MotionDocument, id: NodeId): readonly NodeId[] => {
  const parentId = document.nodes[id]?.parentId ?? null

  return parentId === null ? [document.rootId] : (document.nodes[parentId]?.children ?? [])
}

/**
 * `range` operates on siblings only — EDITOR_ENGINE.md § Modes. With no anchor, or with a target that
 * is not a sibling of the anchor, there is no range to take, and the mode falls back to `replace`:
 * the alternative is a shift-click that does nothing, which reads as a broken click.
 */
function rangeIds(
  document: MotionDocument,
  anchorId: NodeId | null,
  targetId: NodeId | undefined,
): readonly NodeId[] | null {
  if (anchorId === null || targetId === undefined) {
    return null
  }

  const siblings = siblingsOf(document, anchorId)
  const from = siblings.indexOf(anchorId)
  const to = siblings.indexOf(targetId)

  if (from === -1 || to === -1) {
    return null
  }

  return siblings.slice(Math.min(from, to), Math.max(from, to) + 1)
}

const toggled = (current: readonly NodeId[], ids: readonly NodeId[]): readonly NodeId[] => {
  const next = new Set(current)

  for (const id of ids) {
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
  }

  return [...next]
}

export const createSelectionSlice: () => SliceCreator<SelectionSlice> = () => (set, get) => ({
  selection: EMPTY_SELECTION,

  select(ids, mode = 'replace') {
    const { document, selection } = get()
    const range = mode === 'range' ? rangeIds(document, selection.anchorId, ids[0]) : null

    const requested =
      mode === 'add'
        ? [...selection.ids, ...ids]
        : mode === 'toggle'
          ? toggled(selection.ids, ids)
          : (range ?? ids)

    // The anchor follows the last id the caller named, except in `range`, where it is the fixed end
    // the range was measured from and a shift-click further along must keep it.
    const candidate = range !== null ? selection.anchorId : (ids.at(-1) ?? selection.anchorId)
    const anchorId =
      candidate !== null && document.nodes[candidate] !== undefined ? candidate : null

    set(
      {
        selection: { ...selection, ids: normalizeSelection(document, requested), anchorId },
      },
      false,
      `select/${mode}`,
    )
  },

  /** SHORTCUTS.md § Selection: `Mod+A` takes the siblings at the current level, not the whole tree. */
  selectAll() {
    const { document, selection } = get()
    const parentId = selection.isolationId ?? document.rootId

    get().select(document.nodes[parentId]?.children ?? [], 'replace')
  },

  clearSelection() {
    const { selection } = get()

    set(
      { selection: { ...selection, ids: [], anchorId: null, editingId: null } },
      false,
      'clearSelection',
    )
  },

  /**
   * Isolation is Figma's group-entering: while isolated, hit testing prefers descendants of this
   * node. The top level is `isolationId === null`, so entering the root is entering what you are
   * already in — a no-op rather than a second spelling of the same state.
   */
  enterNode(id) {
    const { document, selection } = get()

    if (id === document.rootId || document.nodes[id] === undefined) {
      return
    }

    set({ selection: { ...selection, isolationId: id } }, false, 'enterNode')
  },

  exitNode() {
    const { document, selection } = get()

    if (selection.isolationId === null) {
      return
    }

    const parentId = document.nodes[selection.isolationId]?.parentId ?? null

    set(
      {
        selection: {
          ...selection,
          isolationId: parentId === document.rootId ? null : parentId,
        },
      },
      false,
      'exitNode',
    )
  },

  setHover(id) {
    set({ selection: { ...get().selection, hoverId: id } }, false, 'setHover')
  },

  setEditing(id) {
    set({ selection: { ...get().selection, editingId: id } }, false, 'setEditing')
  },
})
