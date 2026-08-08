import { type BlockId, type NodeId, documentOrderIndex } from '@motion-studio/schema'
import { humanize } from '@motion-studio/utils'

import type { Command } from './command.types'
import {
  detachFromParent,
  requireAcceptance,
  requireCapacity,
  requireNode,
  requireNonEmpty,
  requireSharedParent,
  requireSlot,
  slotChildren,
} from './guards'
import { insertOneNode } from './insert-node'

export interface WrapInContainerPayload {
  readonly ids: readonly NodeId[]
  readonly blockId: BlockId
  /** The container's slot the selection moves into. Defaults to the container's first slot. */
  readonly slot?: string | undefined
  readonly id?: NodeId | undefined
}

/**
 * EDITOR_ENGINE.md § wrapInContainer. One transaction, so it is one undo step: the container is
 * created where the first selected node was, and the selection moves into it in document order.
 */
export function wrapInContainer(payload: WrapInContainerPayload): Command<WrapInContainerPayload> {
  return {
    type: 'wrapInContainer',
    label: `Wrap in ${humanize(payload.blockId)}`,
    payload,
    apply(draft, context) {
      const parent = requireSharedParent(draft, payload.ids)
      const ordered = [...payload.ids].sort(
        (a, b) => documentOrderIndex(draft, a) - documentOrderIndex(draft, b),
      )
      const [first] = requireNonEmpty(ordered)
      const anchor = parent.children.indexOf(first)
      const outerSlot = requireNode(draft, first).slot

      const definition = context.registry.require(payload.blockId)
      const innerSlot = requireSlot(definition, payload.slot ?? definition.slots[0]?.name ?? '')

      for (const id of ordered) {
        requireAcceptance(innerSlot, context.registry.require(requireNode(draft, id).blockId))
      }

      for (const id of ordered) {
        detachFromParent(draft, id)
      }

      const containerId = insertOneNode(draft, context, {
        blockId: payload.blockId,
        parentId: parent.id,
        index: anchor,
        slot: outerSlot,
        id: payload.id,
      })

      const container = requireNode(draft, containerId)
      requireCapacity(
        innerSlot,
        slotChildren(draft, container, innerSlot.name).length,
        ordered.length,
      )

      for (const id of ordered) {
        const node = requireNode(draft, id)

        node.parentId = containerId
        node.slot = innerSlot.name
        container.children.push(id)
      }
    },
  }
}
