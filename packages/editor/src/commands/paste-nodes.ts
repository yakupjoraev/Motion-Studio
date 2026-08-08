import type { Node, NodeId } from '@motion-studio/schema'
import type { Draft } from 'immer'

import type { SerializedSubtree } from '../clipboard/clipboard.types'

import type { Command } from './command.types'
import {
  clampIndex,
  requireAcceptance,
  requireCapacity,
  requireNode,
  requireSlot,
  requireUnlocked,
  slotChildren,
} from './guards'

export interface PasteNodesPayload {
  /** Already validated, sanitised and remapped by `deserializeSubtree`. */
  readonly subtree: SerializedSubtree
  readonly parentId: NodeId
  readonly slot: string
  readonly index: number
}

/**
 * Writes a prepared subtree into the document as one command, which is what makes a paste of five
 * blocks one undo step — EDITOR_ENGINE.md § Transactions.
 *
 * It creates no ids and validates no payload: both happen in `packages/editor/src/clipboard`, before
 * the document is touched, so a rejected paste never reaches a draft. What it does own are the
 * position guards, because a target resolved a moment ago is still a target this command must check.
 */
export function pasteNodes(payload: PasteNodesPayload): Command<PasteNodesPayload> {
  const { subtree } = payload
  const count = subtree.rootIds.length

  return {
    type: 'pasteNodes',
    label: count === 1 ? 'Paste block' : `Paste ${count} blocks`,
    payload,
    apply(draft, context) {
      const parent = requireNode(draft, payload.parentId)
      requireUnlocked(parent)

      const slot = requireSlot(context.registry.require(parent.blockId), payload.slot)

      requireCapacity(slot, slotChildren(draft, parent, slot.name).length, count)

      for (const rootId of subtree.rootIds) {
        const root = subtree.nodes[rootId]

        if (root !== undefined) {
          requireAcceptance(slot, context.registry.require(root.blockId))
        }
      }

      for (const node of Object.values(subtree.nodes)) {
        const isRoot = subtree.rootIds.includes(node.id)

        const written: Draft<Node> = {
          ...node,
          parentId: isRoot ? payload.parentId : node.parentId,
          slot: isRoot ? payload.slot : node.slot,
          children: [...node.children],
          props: { ...node.props },
          responsive: { ...node.responsive },
          motion: { ...node.motion },
          effects: node.effects.map((effect) => ({ ...effect, params: { ...effect.params } })),
        }

        draft.nodes[node.id] = written
      }

      for (const asset of Object.values(subtree.assets)) {
        draft.assets[asset.id] = { ...asset }
      }

      // One splice for the whole batch, so the roots keep the order they were copied in.
      const at = clampIndex(payload.index, parent.children.length)

      parent.children = [
        ...parent.children.slice(0, at),
        ...subtree.rootIds,
        ...parent.children.slice(at),
      ]
    },
  }
}
