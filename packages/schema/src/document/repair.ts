import { type Result, err, ok } from '@motion-studio/utils'

import type { NodeId } from '../ids/ids'
import type { BlockRegistry } from '../registry/registry.types'

import type { MotionDocument, Node } from './document.types'
import { reachableIds } from './traverse'
import { DOCUMENT_ERROR_CODES, type DocumentError } from './validate'

/** FILE_FORMAT.md § Repair vs reject, as codes. One per row of the table that is recoverable. */
export const REPAIR_KINDS = {
  droppedOrphan: 'DROPPED_ORPHAN',
  removedMissingChild: 'REMOVED_MISSING_CHILD',
  rebuiltParent: 'REBUILT_PARENT',
  deduplicatedChildren: 'DEDUPLICATED_CHILDREN',
  unknownBlock: 'UNKNOWN_BLOCK',
  mergedProps: 'MERGED_PROPS',
} as const

export type RepairKind = (typeof REPAIR_KINDS)[keyof typeof REPAIR_KINDS]

export interface Repair {
  readonly kind: RepairKind
  /** What was wrong and what was done, in one sentence — it is shown in the import report. */
  readonly message: string
  readonly nodeIds: readonly NodeId[]
}

export interface RepairOutcome {
  readonly document: MotionDocument
  readonly repairs: readonly Repair[]
}

export interface RepairOptions {
  /** Without one, the two block-level rows of the table cannot be evaluated and are skipped. */
  readonly registry?: BlockRegistry
}

/** Invariant 4, evaluated before anything is rewritten: a cycle makes every other repair guesswork. */
function hasCycle(nodes: Readonly<Record<NodeId, Node>>): NodeId | null {
  const state = new Map<NodeId, 'open' | 'closed'>()

  const visit = (id: NodeId): NodeId | null => {
    const current = state.get(id)

    if (current === 'open') {
      return id
    }

    if (current === 'closed') {
      return null
    }

    state.set(id, 'open')

    for (const child of nodes[id]?.children ?? []) {
      const found = visit(child)

      if (found !== null) {
        return found
      }
    }

    state.set(id, 'closed')

    return null
  }

  for (const id of Object.keys(nodes) as NodeId[]) {
    const found = visit(id)

    if (found !== null) {
      return found
    }
  }

  return null
}

/**
 * Implements FILE_FORMAT.md § Repair vs reject verbatim. Repairing beats refusing a file the user
 * cannot open by hand — but only where the intent is unambiguous. A cycle and a missing root are
 * rejections precisely because repairing them means guessing which edge the author meant to keep, and
 * a silently rewritten tree is worse than a file that will not open.
 *
 * Every repair is returned, never applied silently: the import dialog lists what was wrong, what was
 * done, and how many nodes it touched.
 */
export function repairDocument(
  document: MotionDocument,
  options: RepairOptions = {},
): Result<RepairOutcome, DocumentError[]> {
  if (document.nodes[document.rootId] === undefined) {
    return err([
      {
        code: DOCUMENT_ERROR_CODES.missingRoot,
        message: `The root ${document.rootId} is not in the document, and nothing else identifies one`,
      },
    ])
  }

  const cycleAt = hasCycle(document.nodes)

  if (cycleAt !== null) {
    return err([
      {
        code: DOCUMENT_ERROR_CODES.cycle,
        message: `${cycleAt} is inside a cycle, which cannot be repaired without guessing intent`,
        nodeId: cycleAt,
      },
    ])
  }

  const repairs: Repair[] = []
  const nodes: Record<NodeId, Node> = { ...document.nodes }

  const deduplicated: NodeId[] = []
  const missingChild: NodeId[] = []

  for (const id of Object.keys(nodes) as NodeId[]) {
    const node = nodes[id]

    if (node === undefined) {
      continue
    }

    const seen = new Set<NodeId>()
    const children: NodeId[] = []
    let droppedDuplicate = false
    let droppedMissing = false

    for (const child of node.children) {
      if (seen.has(child)) {
        droppedDuplicate = true
        continue
      }

      if (nodes[child] === undefined) {
        droppedMissing = true
        continue
      }

      seen.add(child)
      children.push(child)
    }

    if (droppedDuplicate) {
      deduplicated.push(id)
    }

    if (droppedMissing) {
      missingChild.push(id)
    }

    if (droppedDuplicate || droppedMissing) {
      nodes[id] = { ...node, children }
    }
  }

  if (deduplicated.length > 0) {
    repairs.push({
      kind: REPAIR_KINDS.deduplicatedChildren,
      message: 'A node listed the same child twice; the duplicate entries were removed',
      nodeIds: deduplicated,
    })
  }

  if (missingChild.length > 0) {
    repairs.push({
      kind: REPAIR_KINDS.removedMissingChild,
      message: 'A node listed a child that is not in the document; the reference was removed',
      nodeIds: missingChild,
    })
  }

  // `children` is the structure; `parentId` is the cache. When they disagree, the cache is wrong.
  const rebuilt: NodeId[] = []

  for (const id of Object.keys(nodes) as NodeId[]) {
    const node = nodes[id]

    if (node === undefined) {
      continue
    }

    const parent =
      id === document.rootId
        ? null
        : ((Object.keys(nodes) as NodeId[]).find((candidate) =>
            (nodes[candidate]?.children ?? []).includes(id),
          ) ?? null)

    if (node.parentId !== parent) {
      rebuilt.push(id)
      nodes[id] = { ...node, parentId: parent }
    }
  }

  if (rebuilt.length > 0) {
    repairs.push({
      kind: REPAIR_KINDS.rebuiltParent,
      message: 'A node disagreed with its parent about who owns it; `children` was trusted',
      nodeIds: rebuilt,
    })
  }

  const reachable = reachableIds({ ...document, nodes })
  const orphans = (Object.keys(nodes) as NodeId[]).filter((id) => !reachable.has(id))

  for (const id of orphans) {
    delete nodes[id]
  }

  if (orphans.length > 0) {
    repairs.push({
      kind: REPAIR_KINDS.droppedOrphan,
      message: 'A node was unreachable from the root and was dropped',
      nodeIds: orphans,
    })
  }

  repairs.push(...repairBlocks(nodes, options.registry))

  return ok({ document: { ...document, nodes }, repairs })
}

/**
 * The two block-level rows: an unknown block keeps its node (the canvas renders a placeholder), and
 * invalid props are merged over the block's defaults so the valid keys survive.
 */
function repairBlocks(
  nodes: Record<NodeId, Node>,
  registry: BlockRegistry | undefined,
): readonly Repair[] {
  if (registry === undefined) {
    return []
  }

  const repairs: Repair[] = []
  const unknown: NodeId[] = []
  const merged: NodeId[] = []

  for (const id of Object.keys(nodes) as NodeId[]) {
    const node = nodes[id]

    if (node === undefined) {
      continue
    }

    const definition = registry.get(node.blockId)

    if (definition === undefined) {
      unknown.push(id)
      continue
    }

    if (definition.propsSchema.safeParse(node.props).success) {
      continue
    }

    const defaults = definition.defaults as Record<string, unknown>
    const kept: Record<string, unknown> = { ...defaults }

    for (const [key, value] of Object.entries(node.props)) {
      const candidate = definition.propsSchema.safeParse({ ...defaults, [key]: value })

      if (candidate.success) {
        kept[key] = value
      }
    }

    merged.push(id)
    nodes[id] = { ...node, props: kept }
  }

  if (unknown.length > 0) {
    repairs.push({
      kind: REPAIR_KINDS.unknownBlock,
      message: 'A node uses a block this version does not know; it was kept for a placeholder',
      nodeIds: unknown,
    })
  }

  if (merged.length > 0) {
    repairs.push({
      kind: REPAIR_KINDS.mergedProps,
      message: 'A node had props its block rejects; the valid ones were merged over the defaults',
      nodeIds: merged,
    })
  }

  return repairs
}
