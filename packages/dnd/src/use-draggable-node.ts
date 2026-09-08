'use client'

import { useDraggable } from '@dnd-kit/core'
import type { BlockId, NodeId } from '@motion-studio/schema'
import { useMemo } from 'react'

import type { DragPayload, DropSurface } from './dnd.types'

/**
 * Both surfaces hold a source for the same node, and dnd-kit keys its draggables by id — so the
 * identity is the surface and the node, exactly as ADR-181 made a zone's identity. Under one id
 * dnd-kit kept whichever registered last, and a drag begun on the canvas reported the tree row's
 * box: measured in the browser, a keyboard drop resolved against the layers panel's coordinates and
 * landed nowhere (ADR-381).
 */
export const dragSourceId = (surface: DropSurface, nodeId: string): string => `${surface}:${nodeId}`

export interface DraggableNodeOptions {
  /** The node the gesture started on. */
  readonly nodeId: NodeId
  readonly blockId: BlockId
  /** Which surface holds this source — the other half of its identity. */
  readonly surface: DropSurface
  /**
   * Every node the drag carries — the selection when the grabbed node is part of it, otherwise just
   * the grabbed node. Resolving that is the store's job, not this hook's.
   */
  readonly nodeIds: readonly NodeId[]
  readonly labels: readonly string[]
  readonly disabled?: boolean
}

/** The canvas end of operations 2 and 4: a node moves, alone or with the rest of the selection. */
export function useDraggableNode({
  nodeId,
  blockId,
  nodeIds,
  labels,
  surface,
  disabled = false,
}: DraggableNodeOptions) {
  const data = useMemo<DragPayload>(
    () => ({ kind: 'canvas-nodes', blockId, nodeIds, labels }),
    [blockId, nodeIds, labels],
  )

  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: dragSourceId(surface, nodeId),
    data,
    disabled,
    attributes: { roleDescription: 'draggable layer' },
  })

  /*
   * The role and the tab order belong to the surface, not to the drag — ADR-376.
   *
   * dnd-kit hands out `role="button"` and `tabIndex={0}`, which fit a palette card and fit nothing
   * else here. A layers row is a `treeitem` with a roving tabindex and always overrode both; a canvas
   * node is a box around a block that renders its own buttons, and there the pair made every node a
   * control wrapping controls — 82 axe `nested-interactive` violations. What is left is what the drag
   * actually needs: the roledescription, the pointer to the instructions, and the disabled state.
   */
  const { role: _role, tabIndex: _tabIndex, ...dragAttributes } = attributes

  return { attributes: dragAttributes, isDragging, listeners, ref: setNodeRef }
}
