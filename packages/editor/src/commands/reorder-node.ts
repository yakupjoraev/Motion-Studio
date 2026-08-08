import type { NodeId } from '@motion-studio/schema'
import { move } from '@motion-studio/utils'

import type { Command } from './command.types'
import { clampIndex, requireNode, requireSharedParent, writeChildren } from './guards'

export interface ReorderNodePayload {
  readonly nodeId: NodeId
  /** The index among the siblings **after** the node has been taken out — what a drop line means. */
  readonly index: number
}

export function reorderNode(payload: ReorderNodePayload): Command<ReorderNodePayload> {
  return {
    type: 'reorderNode',
    label: 'Reorder block',
    payload,
    apply(draft) {
      requireNode(draft, payload.nodeId)

      const parent = requireSharedParent(draft, [payload.nodeId])
      const from = parent.children.indexOf(payload.nodeId)

      writeChildren(
        parent,
        move(parent.children, from, clampIndex(payload.index, parent.children.length - 1)),
      )
    },
  }
}
