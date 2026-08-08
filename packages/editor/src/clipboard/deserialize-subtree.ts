import {
  type Asset,
  type AssetId,
  type BlockId,
  type BlockRegistry,
  type MotionDocument,
  type Node,
  type NodeId,
  type Removal,
  assetId,
  nodeId,
  sanitizeDocument,
} from '@motion-studio/schema'
import type { MotionStudioError, Result } from '@motion-studio/utils'
import { err, ok } from '@motion-studio/utils'

import { remapRecord } from '../commands/duplicate-nodes'
import { prefixedId } from '../commands/guards'

import {
  CLIPBOARD_CODES,
  type RejectedBlock,
  SUBTREE_VERSION,
  type SerializedSubtree,
  clipboardError,
  serializedSubtreeSchema,
} from './clipboard.types'

export interface DeserializeOptions {
  readonly registry: BlockRegistry
  readonly generateId: () => NodeId
  /** The sanitizer works on a document, so the pasted nodes travel in the target's envelope. */
  readonly document: MotionDocument
}

export interface DeserializedSubtree {
  /** Known blocks only, every id fresh, already sanitised. */
  readonly subtree: SerializedSubtree
  readonly requested: number
  readonly rejected: readonly RejectedBlock[]
  readonly removed: readonly Removal[]
}

/** A payload arrives as clipboard text or as the object the store kept. Both end up here. */
function readPayload(input: unknown): Result<unknown, MotionStudioError> {
  if (typeof input !== 'string') {
    return ok(input)
  }

  try {
    return ok(JSON.parse(input))
  } catch (error) {
    return err(clipboardError(CLIPBOARD_CODES.notJson, 'The clipboard did not hold JSON', error))
  }
}

interface Pruned {
  readonly nodes: ReadonlyMap<NodeId, Node>
  readonly rootIds: readonly NodeId[]
  readonly rejected: readonly RejectedBlock[]
}

/**
 * Walks the payload from its roots, keeping the nodes whose block the registry has and dropping an
 * unknown block with everything under it — ADR-071. Walking rather than iterating the record also
 * drops nodes nothing references, and the `seen` set ends a payload that points at itself.
 */
function prune(payload: SerializedSubtree, registry: BlockRegistry): Pruned {
  const source = new Map<NodeId, Node>(
    Object.entries(payload.nodes)
      .filter(([key, node]) => key === node.id)
      .map(([, node]) => [node.id, node]),
  )

  const kept = new Map<NodeId, Node>()
  const cost = new Map<BlockId, number>()
  const seen = new Set<NodeId>()

  const subtreeSize = (id: NodeId): number => {
    const node = source.get(id)

    if (node === undefined || seen.has(id)) {
      return 0
    }

    seen.add(id)

    return node.children.reduce((total, child) => total + subtreeSize(child), 1)
  }

  const visit = (id: NodeId): boolean => {
    const node = source.get(id)

    if (node === undefined || seen.has(id)) {
      return false
    }

    if (registry.get(node.blockId) === undefined) {
      cost.set(node.blockId, (cost.get(node.blockId) ?? 0) + subtreeSize(id))

      return false
    }

    seen.add(id)

    const children = node.children.filter((child) => visit(child))

    kept.set(id, { ...node, children })

    return true
  }

  return {
    nodes: kept,
    rootIds: payload.rootIds.filter((id) => visit(id)),
    rejected: [...cost].map(([blockId, nodes]) => ({ blockId, nodes })),
  }
}

/** Node ids, asset ids and shared-layout keys in one map, so one walk rewrites every reference. */
function buildIdMap(
  pruned: Pruned,
  payload: SerializedSubtree,
  generateId: () => NodeId,
): Map<string, string> {
  const ids = new Map<string, string>()

  for (const node of pruned.nodes.values()) {
    ids.set(node.id, generateId())

    const layoutId = node.props['layoutId']

    if (typeof layoutId === 'string' && !ids.has(layoutId)) {
      ids.set(layoutId, prefixedId(generateId, 'layout'))
    }
  }

  for (const id of Object.keys(payload.assets)) {
    ids.set(id, prefixedId(generateId, 'asset'))
  }

  return ids
}

function remapNode(node: Node, ids: ReadonlyMap<string, string>, generateId: () => NodeId): Node {
  const responsive: Record<string, Record<string, unknown>> = {}

  for (const [breakpoint, overrides] of Object.entries(node.responsive)) {
    if (overrides !== undefined) {
      responsive[breakpoint] = remapRecord(overrides, ids)
    }
  }

  return {
    ...node,
    id: nodeId(ids.get(node.id) ?? node.id),
    // A root's parent is outside the payload, so it keeps the id it had: that is what paste-in-place
    // looks the original parent up by, and `pasteNodes` overwrites it with the real target.
    parentId: node.parentId === null ? null : nodeId(ids.get(node.parentId) ?? node.parentId),
    children: node.children.map((child) => nodeId(ids.get(child) ?? child)),
    props: remapRecord(node.props, ids),
    responsive: responsive as Node['responsive'],
    effects: node.effects.map((effect) => ({
      ...effect,
      id: prefixedId(generateId, 'fx'),
      params: remapRecord(effect.params, ids),
    })),
  }
}

function remap(
  pruned: Pruned,
  payload: SerializedSubtree,
  generateId: () => NodeId,
): SerializedSubtree {
  const ids = buildIdMap(pruned, payload, generateId)
  const nodes: Record<string, Node> = {}
  const assets: Record<string, Asset> = {}
  const origins: Record<string, number> = {}

  for (const node of pruned.nodes.values()) {
    const remapped = remapNode(node, ids, generateId)

    nodes[remapped.id] = remapped
  }

  for (const [id, asset] of Object.entries(payload.assets)) {
    const fresh = ids.get(id) ?? id

    assets[fresh] = { ...asset, id: assetId(fresh) }
  }

  const rootIds = pruned.rootIds.map((id) => nodeId(ids.get(id) ?? id))

  for (const id of pruned.rootIds) {
    origins[ids.get(id) ?? id] = payload.origins[id] ?? 0
  }

  return {
    version: SUBTREE_VERSION,
    rootIds,
    nodes: nodes as Readonly<Record<NodeId, Node>>,
    assets: assets as Readonly<Record<AssetId, Asset>>,
    origins: origins as Readonly<Record<NodeId, number>>,
    theme: payload.theme,
  }
}

/**
 * A pasted payload is untrusted input — FILE_FORMAT.md § Security — so it goes through the same four
 * stages as an imported file: parse, validate, prune what this build cannot render, sanitise. Ids are
 * regenerated last, which is what puts the sanitiser's report paths on ids the document will have.
 *
 * The failures that return `err` all leave the document untouched. Everything else is a partial
 * paste with a report, because a hero this build does not have should not cost the user the four
 * blocks beside it.
 */
export function deserializeSubtree(
  input: unknown,
  options: DeserializeOptions,
): Result<DeserializedSubtree, MotionStudioError> {
  const read = readPayload(input)

  if (!read.ok) {
    return read
  }

  const parsed = serializedSubtreeSchema.safeParse(read.value)

  if (!parsed.success) {
    return err(
      clipboardError(
        CLIPBOARD_CODES.invalidPayload,
        `The clipboard payload is not a Motion Studio selection: ${parsed.error.issues
          .slice(0, 3)
          .map((issue) => issue.path.join('.'))
          .join(', ')}`,
        parsed.error,
      ),
    )
  }

  const payload = parsed.data as SerializedSubtree

  if (payload.version > SUBTREE_VERSION) {
    return err(
      clipboardError(
        CLIPBOARD_CODES.futureVersion,
        `The copied blocks were made with a newer version (${payload.version})`,
      ),
    )
  }

  const pruned = prune(payload, options.registry)

  if (pruned.rootIds.length === 0) {
    return err(
      clipboardError(
        CLIPBOARD_CODES.noBlocksAvailable,
        `None of the copied blocks are available: ${pruned.rejected
          .map((entry) => entry.blockId)
          .join(', ')}`,
      ),
    )
  }

  const remapped = remap(pruned, payload, options.generateId)
  const sanitized = sanitizeDocument({
    ...options.document,
    nodes: remapped.nodes,
    assets: remapped.assets,
  })

  return ok({
    subtree: { ...remapped, nodes: sanitized.document.nodes, assets: sanitized.document.assets },
    requested: Object.keys(payload.nodes).length,
    rejected: pruned.rejected,
    removed: sanitized.removed,
  })
}
