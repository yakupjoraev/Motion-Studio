'use client'

import { useDraggable } from '@dnd-kit/core'
import type { BlockId, NodeId } from '@motion-studio/schema'
import { useMemo } from 'react'

import type { DragPayload } from './dnd.types'

export interface DraggableNodeOptions {
  /** The node the gesture started on. */
  readonly nodeId: NodeId
  readonly blockId: BlockId
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
  disabled = false,
}: DraggableNodeOptions) {
  const data = useMemo<DragPayload>(
    () => ({ kind: 'canvas-nodes', blockId, nodeIds, labels }),
    [blockId, nodeIds, labels],
  )

  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: nodeId,
    data,
    disabled,
    attributes: { roleDescription: 'draggable layer' },
  })

  return { attributes, isDragging, listeners, ref: setNodeRef }
}
