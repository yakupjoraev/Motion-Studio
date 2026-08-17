'use client'

import { blockRegistry } from '@motion-studio/blocks/registry'
import { type DropOrientation, type DropZoneOptions, useDropZone } from '@motion-studio/dnd'
import type { BlockId, NodeId, UnknownProps } from '@motion-studio/schema'

export interface NodeDropZoneOptions {
  readonly id: NodeId
  readonly blockId: BlockId
  /** Resolved props — ADR-130: the slot answers its own orientation from them. */
  readonly props: UnknownProps
  readonly childIds: readonly NodeId[]
  /** A locked node is still a zone: it rejects with a reason rather than vanishing. */
  readonly locked: boolean
  /** A comparison frame renders the same ids and registers nothing — ADR-181. */
  readonly disabled: boolean
}

/**
 * Operation 1 of DRAG_AND_DROP.md § The four operations, at the canvas end: every node whose block
 * holds children is a drop zone, and its geometry is the node's own box — the rect the cache already
 * measured, handed to the drag layer through `DndHost`'s zone source (ADR-181).
 *
 * The returned ref goes on the node wrapper itself. There is no extra element: an overlay would need
 * a positioned ancestor the wrapper does not have, and a wrapper of its own would change the layout
 * of every block on the canvas.
 */
export function useNodeDropZone(options: NodeDropZoneOptions) {
  return useDropZone(nodeZone(options))
}

/**
 * The zone a node comes to, as a value — which is what lets "a grid declares a grid orientation" and
 * "a block with no slots is no zone" be tests rather than a walk through a rendered canvas.
 */
export function nodeZone({
  id,
  blockId,
  props,
  childIds,
  locked,
  disabled,
}: NodeDropZoneOptions): DropZoneOptions {
  const definition = blockRegistry.get(blockId)
  const slot = definition?.slots[0]
  const orientation: DropOrientation = slot?.orientation?.(props) ?? 'vertical'

  return {
    parentId: id,
    slot: slot?.name ?? '',
    orientation,
    label: definition?.name ?? blockId,
    childIds,
    surface: 'canvas',
    disabled: disabled || slot === undefined || locked,
  }
}
