'use client'

import type { NodeDragHandle } from '@motion-studio/canvas'
import { useDraggableNode } from '@motion-studio/dnd'
import { selectors } from '@motion-studio/editor'
import type { BlockId, NodeId } from '@motion-studio/schema'
import { useMemo } from 'react'

import { useStudioStore } from '../../../store/editor-store'

export interface NodeDragOptions {
  readonly id: NodeId
  readonly blockId: BlockId
  readonly locked: boolean
  readonly hidden: boolean
  /** A comparison frame renders the same ids and must register no source — ADR-163, ADR-181. */
  readonly disabled: boolean
}

/**
 * Operation 2 of DRAG_AND_DROP.md § The four operations: a node on the canvas is a drag source —
 * ADR-359.
 *
 * **Which node moves is the same question as which node a click selects**, and it is answered the same
 * way: the nodes at the current level, meaning the children of the isolation or of the root. Anything
 * else and the two gestures disagree — a press would select the section and a drag would carry the
 * paragraph inside it, from the same pixel.
 *
 * `useCanvasSelection` selects on `pointerdown` rather than on `click` precisely so this gesture is
 * continuous: press, and the same movement that would have been a marquee is now the node moving.
 */
/*
 * The return type is written out rather than inferred: dnd-kit's hook types reach into its own
 * `dist/` paths, and an inferred type here would name a path that only resolves from inside
 * `packages/dnd`. `NodeDragHandle` is what the wrapper takes anyway.
 */
export function useNodeDrag({
  id,
  blockId,
  locked,
  hidden,
  disabled,
}: NodeDragOptions): NodeDragHandle {
  const isolationId = useStudioStore(selectors.selectIsolationId)
  const rootId = useStudioStore((state) => state.document.rootId)
  const parentId = useStudioStore((state) => state.document.nodes[id]?.parentId ?? null)
  const selection = useStudioStore(selectors.selectSelectionIds)

  const atCurrentLevel = parentId !== null && parentId === (isolationId ?? rootId)

  /** The whole selection when this node is part of it — the layers tree's rule, and for its reason. */
  const dragged = useMemo(() => (selection.includes(id) ? selection : [id]), [id, selection])

  /*
   * Read once rather than subscribed: a name that changes mid-drag is not a case, and subscribing
   * every node on the canvas to the document is the re-render PERFORMANCE.md § Selector discipline
   * forbids.
   */
  const labels = useMemo(
    () => dragged.map((one) => useStudioStore.getState().document.nodes[one]?.name ?? one),
    [dragged],
  )

  return useDraggableNode({
    nodeId: id,
    blockId,
    nodeIds: dragged,
    labels,
    // The root is the document; a locked node is one the user pinned down; a hidden one has no box to
    // grab. A node below the current level is reached by entering its parent, not by dragging through.
    disabled: disabled || locked || hidden || !atCurrentLevel,
  })
}
