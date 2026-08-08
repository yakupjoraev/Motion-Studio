import {
  type MotionDocument,
  type NodeId,
  documentOrderIndex,
  isDescendant,
} from '@motion-studio/schema'
import type { Draft } from 'immer'

import type { Command } from './command.types'
import {
  COMMAND_CODES,
  clampIndex,
  commandError,
  requireAcceptance,
  requireCapacity,
  requireNode,
  requireNotRoot,
  requireSlot,
  requireUnlocked,
  writeChildren,
} from './guards'

export interface MoveNodesPayload {
  readonly ids: readonly NodeId[]
  readonly parentId: NodeId
  readonly index: number
  /** Defaults to each node's current slot, which is what a same-parent reorder means. */
  readonly slot?: string | undefined
}

interface PendingLists {
  readonly listOf: (parentId: NodeId) => NodeId[]
  readonly lists: ReadonlyMap<NodeId, NodeId[]>
}

/** The children of every parent this move touches, as plain arrays the command edits before writing. */
function pendingLists(draft: Draft<MotionDocument>): PendingLists {
  const lists = new Map<NodeId, NodeId[]>()

  const listOf = (parentId: NodeId): NodeId[] => {
    const existing = lists.get(parentId)

    if (existing !== undefined) {
      return existing
    }

    const fresh = [...requireNode(draft, parentId).children]
    lists.set(parentId, fresh)

    return fresh
  }

  return { listOf, lists }
}

/**
 * EDITOR_ENGINE.md § moveNodes. Two things this order buys, and both have a test:
 *
 * - **Remove, then insert.** Moving a node forward inside its own parent is off by one otherwise:
 *   `[a,b,c,d]` with `a` to index 2 is `[b,c,a,d]`, and inserting first makes it `[b,a,c,d]`.
 * - **Document order, then insert one by one.** A multi-move keeps the relative order the user sees.
 */
export function moveNodes(payload: MoveNodesPayload): Command<MoveNodesPayload> {
  const count = payload.ids.length

  return {
    type: 'moveNodes',
    label: count === 1 ? 'Move block' : `Move ${count} blocks`,
    payload,
    apply(draft, context) {
      const target = requireNode(draft, payload.parentId)
      requireUnlocked(target)

      const targetDefinition = context.registry.require(target.blockId)
      const ordered = [...payload.ids].sort(
        (a, b) => documentOrderIndex(draft, a) - documentOrderIndex(draft, b),
      )

      for (const id of ordered) {
        const node = requireNode(draft, id)
        requireNotRoot(draft, id)

        if (payload.parentId === id || isDescendant(draft, payload.parentId, id)) {
          throw commandError(
            COMMAND_CODES.moveIntoDescendant,
            `${node.name} cannot be moved inside itself`,
          )
        }

        requireAcceptance(
          requireSlot(targetDefinition, payload.slot ?? node.slot),
          context.registry.require(node.blockId),
        )
      }

      const { listOf, lists } = pendingLists(draft)
      const arriving = new Map<string, number>()

      for (const id of ordered) {
        const node = requireNode(draft, id)
        const parentId = node.parentId

        if (parentId !== null) {
          const list = listOf(parentId)
          const at = list.indexOf(id)

          if (at !== -1) {
            list.splice(at, 1)
          }
        }

        const name = payload.slot ?? node.slot
        arriving.set(name, (arriving.get(name) ?? 0) + 1)
      }

      const targetList = listOf(payload.parentId)

      for (const [name, incoming] of arriving) {
        const occupied = targetList.filter((id) => draft.nodes[id]?.slot === name).length

        requireCapacity(requireSlot(targetDefinition, name), occupied, incoming)
      }

      targetList.splice(clampIndex(payload.index, targetList.length), 0, ...ordered)

      for (const id of ordered) {
        const node = requireNode(draft, id)

        node.parentId = payload.parentId
        node.slot = payload.slot ?? node.slot
      }

      for (const [parentId, list] of lists) {
        writeChildren(requireNode(draft, parentId), list)
      }
    },
  }
}
