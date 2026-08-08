import type { NodeId } from '@motion-studio/schema'

import type { Command } from './command.types'
import {
  detachFromParent,
  requireAcceptance,
  requireCapacity,
  requireNode,
  requireNotRoot,
  requireSharedParent,
  requireSlot,
  slotChildren,
} from './guards'

export interface UnwrapPayload {
  readonly nodeId: NodeId
}

/**
 * The inverse of `wrapInContainer`: the children take the wrapper's place, in order and in its slot,
 * and the wrapper is deleted. The parent must accept them — a section's children are not always
 * legal where the section was.
 */
export function unwrap(payload: UnwrapPayload): Command<UnwrapPayload> {
  return {
    type: 'unwrap',
    label: 'Unwrap',
    payload,
    apply(draft, context) {
      const wrapper = requireNode(draft, payload.nodeId)
      requireNotRoot(draft, payload.nodeId)

      const parent = requireSharedParent(draft, [payload.nodeId])
      const slot = requireSlot(context.registry.require(parent.blockId), wrapper.slot)
      const hoisted = [...wrapper.children]

      for (const id of hoisted) {
        requireAcceptance(slot, context.registry.require(requireNode(draft, id).blockId))
      }

      const anchor = parent.children.indexOf(payload.nodeId)

      detachFromParent(draft, payload.nodeId)
      requireCapacity(slot, slotChildren(draft, parent, slot.name).length, hoisted.length)

      parent.children.splice(anchor, 0, ...hoisted)

      for (const id of hoisted) {
        const node = requireNode(draft, id)

        node.parentId = parent.id
        node.slot = wrapper.slot
      }

      delete draft.nodes[payload.nodeId]
    },
  }
}
