import type { BlockId, MotionDocument, Node, NodeId } from '@motion-studio/schema'
import { humanize, insertAt } from '@motion-studio/utils'
import type { Draft } from 'immer'

import type { Command, CommandContext } from './command.types'
import {
  clampIndex,
  requireAcceptance,
  requireCapacity,
  requireFreshId,
  requireNode,
  requireProps,
  requireSlot,
  requireUnlocked,
  slotChildren,
} from './guards'

export interface InsertNodePayload {
  readonly blockId: BlockId
  readonly parentId: NodeId
  /** Position among the parent's children; past either end lands at that end. */
  readonly index: number
  readonly slot: string
  readonly props?: Record<string, unknown> | undefined
  readonly name?: string | undefined
  /** Chosen by the caller when it needs to select the result — ADR-061. */
  readonly id?: NodeId | undefined
}

/**
 * The five guards of EDITOR_ENGINE.md § insertNode, then the write. Shared with `insertBlock` and
 * `wrapInContainer`, which create nodes under the same rules and differ only in what they create.
 */
export function insertOneNode(
  draft: Draft<MotionDocument>,
  context: CommandContext,
  payload: InsertNodePayload,
): NodeId {
  const parent = requireNode(draft, payload.parentId)
  requireUnlocked(parent)

  const slot = requireSlot(context.registry.require(parent.blockId), payload.slot)
  const definition = context.registry.require(payload.blockId)

  requireAcceptance(slot, definition)
  requireCapacity(slot, slotChildren(draft, parent, slot.name).length, 1)

  const id = payload.id ?? context.generateId()
  requireFreshId(draft, id)

  const node: Draft<Node> = {
    id,
    blockId: payload.blockId,
    name: payload.name ?? definition.name,
    parentId: payload.parentId,
    slot: payload.slot,
    children: [],
    props: requireProps(definition, { ...definition.defaults, ...payload.props }),
    responsive: {},
    // ADR-154: the block's `defaultMotion` is materialised into the node, exactly as `defaults` is
    // for props. A node therefore states its own motion, which is what lets `clearMotion` remove an
    // entrance rather than have the block hand it straight back.
    motion: structuredClone(definition.defaultMotion),
    effects: [],
    locked: false,
    hidden: false,
  }

  draft.nodes[id] = node
  parent.children = insertAt(parent.children, clampIndex(payload.index, parent.children.length), id)

  return id
}

/** One node, with the block's defaults merged under any override the caller passes. */
export function insertNode(payload: InsertNodePayload): Command<InsertNodePayload> {
  return {
    type: 'insertNode',
    label: `Insert ${humanize(payload.blockId)}`,
    payload,
    apply(draft, context) {
      insertOneNode(draft, context, payload)
    },
  }
}
