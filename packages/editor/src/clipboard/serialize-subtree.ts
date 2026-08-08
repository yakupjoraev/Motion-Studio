import {
  type Asset,
  type AssetId,
  type MotionDocument,
  type Node,
  type NodeId,
  walk,
} from '@motion-studio/schema'

import { SUBTREE_VERSION, type SerializedSubtree } from './clipboard.types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** Every string anywhere in a value, which is where an asset id hides — a prop, a list item, a param. */
function collectStrings(value: unknown, found: Set<string>): void {
  if (typeof value === 'string') {
    found.add(value)

    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, found)
    }

    return
  }

  if (isRecord(value)) {
    for (const item of Object.values(value)) {
      collectStrings(item, found)
    }
  }
}

function referencedStrings(nodes: readonly Node[]): ReadonlySet<string> {
  const found = new Set<string>()

  for (const node of nodes) {
    collectStrings(node.props, found)
    collectStrings(node.responsive, found)

    for (const effect of node.effects) {
      collectStrings(effect.params, found)
    }
  }

  return found
}

/**
 * EDITOR_ENGINE.md § Clipboard. Takes the **normalized** selection — `normalizeSelection` has already
 * dropped any node with an ancestor in the set — and returns it with every descendant, every asset it
 * references, and the palette, so a paste into another document can still resolve token references.
 *
 * Assets are found by value rather than by a declared prop path: an asset id is a string, blocks name
 * their image props whatever they like, and a paste that loses the image is worse than one that
 * carries a spare.
 */
export function serializeSubtree(
  document: MotionDocument,
  rootIds: readonly NodeId[],
): SerializedSubtree {
  const nodes: Record<string, Node> = {}
  const origins: Record<string, number> = {}
  const roots: NodeId[] = []

  for (const rootId of rootIds) {
    const root = document.nodes[rootId]

    if (root === undefined) {
      continue
    }

    roots.push(rootId)

    const parent = root.parentId === null ? undefined : document.nodes[root.parentId]

    origins[rootId] = parent === undefined ? 0 : parent.children.indexOf(rootId)

    for (const node of walk(document, rootId)) {
      nodes[node.id] = node
    }
  }

  const referenced = referencedStrings(Object.values(nodes))
  const assets: Record<string, Asset> = {}

  for (const [id, asset] of Object.entries(document.assets)) {
    if (referenced.has(id)) {
      assets[id] = asset
    }
  }

  return {
    version: SUBTREE_VERSION,
    rootIds: roots,
    nodes: nodes as Readonly<Record<NodeId, Node>>,
    assets: assets as Readonly<Record<AssetId, Asset>>,
    origins: origins as Readonly<Record<NodeId, number>>,
    theme: { palette: document.theme.palette },
  }
}
