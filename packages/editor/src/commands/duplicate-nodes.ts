import {
  type MotionDocument,
  type Node,
  type NodeId,
  documentOrderIndex,
  nodeId,
  walk,
} from '@motion-studio/schema'
import { insertAt, truncate } from '@motion-studio/utils'
import { type Draft, current } from 'immer'

import type { Command, CommandContext } from './command.types'
import {
  prefixedId,
  requireCapacity,
  requireNode,
  requireNotRoot,
  requireSharedParent,
  requireSlot,
  slotChildren,
} from './guards'

export interface DuplicateNodesPayload {
  readonly ids: readonly NodeId[]
}

/** `nodeSchema` caps a name at 80, and the longest suffix this adds is ` copy 99`. */
const MAX_BASE_NAME = 71

function copyName(taken: ReadonlySet<string>, name: string): string {
  const base = name.length > MAX_BASE_NAME ? truncate(name, MAX_BASE_NAME) : name
  const first = `${base} copy`

  if (!taken.has(first)) {
    return first
  }

  let ordinal = 2

  while (taken.has(`${base} copy ${ordinal}`)) {
    ordinal += 1
  }

  return `${base} copy ${ordinal}`
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** Every string in the subtree that names something the copy must own — ADR-060. */
function remap(value: unknown, ids: ReadonlyMap<string, string>): unknown {
  if (typeof value === 'string') {
    return ids.get(value) ?? value
  }

  if (Array.isArray(value)) {
    return value.map((item) => remap(item, ids))
  }

  if (isRecord(value)) {
    return remapRecord(value, ids)
  }

  return value
}

/** Shared with the clipboard, which remaps the same kinds of reference on paste. */
export function remapRecord(
  record: Record<string, unknown>,
  ids: ReadonlyMap<string, string>,
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, remap(item, ids)]))
}

function buildIdMap(
  subtree: readonly Node[],
  context: CommandContext,
): ReadonlyMap<string, string> {
  const ids = new Map<string, string>()

  for (const node of subtree) {
    ids.set(node.id, context.generateId())

    const layoutId = node.props['layoutId']

    if (typeof layoutId === 'string' && !ids.has(layoutId)) {
      ids.set(layoutId, prefixedId(context.generateId, 'layout'))
    }
  }

  return ids
}

function cloneNode(
  node: Node,
  ids: ReadonlyMap<string, string>,
  context: CommandContext,
): Draft<Node> {
  const responsive: Record<string, Record<string, unknown>> = {}

  for (const [breakpoint, record] of Object.entries(node.responsive)) {
    if (record !== undefined) {
      responsive[breakpoint] = remapRecord(record, ids)
    }
  }

  return {
    ...node,
    id: nodeId(ids.get(node.id) ?? node.id),
    parentId: node.parentId === null ? null : nodeId(ids.get(node.parentId) ?? node.parentId),
    children: node.children.map((child) => nodeId(ids.get(child) ?? child)),
    props: remapRecord(node.props, ids),
    responsive,
    motion: { ...node.motion },
    effects: node.effects.map((effect) => ({
      ...effect,
      id: prefixedId(context.generateId, 'fx'),
    })),
  }
}

function duplicateOne(draft: Draft<MotionDocument>, context: CommandContext, id: NodeId): void {
  const original = requireNode(draft, id)
  requireNotRoot(draft, id)

  const parent = requireSharedParent(draft, [id])

  const slot = requireSlot(context.registry.require(parent.blockId), original.slot)

  requireCapacity(slot, slotChildren(draft, parent, slot.name).length, 1)

  // `current` rather than a spread: the walk yields drafts, and a shallow copy would leave the copy
  // sharing the original's `props` object — two nodes, one object, and a patch that changes both.
  const subtree = [...walk(draft, id)].map((node) => current(node))
  const ids = buildIdMap(subtree, context)
  const taken = new Set(parent.children.map((child) => draft.nodes[child]?.name ?? ''))

  for (const node of subtree) {
    const clone = cloneNode(node, ids, context)

    draft.nodes[clone.id] = node.id === id ? { ...clone, name: copyName(taken, node.name) } : clone
  }

  const copyId = nodeId(ids.get(id) ?? id)

  parent.children = insertAt(parent.children, parent.children.indexOf(id) + 1, copyId)
}

/**
 * EDITOR_ENGINE.md § duplicateNodes. Each copy lands directly after its own original, so duplicating
 * a multi-selection reads as a set of pairs rather than as a block of copies at the end.
 */
export function duplicateNodes(payload: DuplicateNodesPayload): Command<DuplicateNodesPayload> {
  const count = payload.ids.length

  return {
    type: 'duplicateNodes',
    label: count === 1 ? 'Duplicate block' : `Duplicate ${count} blocks`,
    payload,
    apply(draft, context) {
      const ordered = [...payload.ids].sort(
        (a, b) => documentOrderIndex(draft, a) - documentOrderIndex(draft, b),
      )

      for (const id of ordered) {
        duplicateOne(draft, context, id)
      }
    },
  }
}
