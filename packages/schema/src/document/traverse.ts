import type { NodeId } from '../ids/ids'

import type { MotionDocument, Node } from './document.types'

/**
 * `Object.keys` widens a branded key back to `string`. This is the one place that narrowing is
 * restated, and it is sound because the only writer of `nodes` is the schema, whose key pattern is
 * the id pattern.
 */
export const nodeIds = (document: MotionDocument): readonly NodeId[] =>
  Object.keys(document.nodes) as NodeId[]

/**
 * Depth-first from the root, in document order, skipping ids that are not in `nodes` and never
 * visiting the same node twice. Both guards matter: this runs on files that have not been validated
 * yet, so a dangling child reference or a cycle must end the walk rather than crash it or hang.
 */
export function* walk(document: MotionDocument, from?: NodeId): Generator<Node> {
  const start = from ?? document.rootId
  const seen = new Set<NodeId>()
  const stack: NodeId[] = [start]

  while (stack.length > 0) {
    const id = stack.pop()

    if (id === undefined || seen.has(id)) {
      continue
    }

    seen.add(id)

    const node = document.nodes[id]

    if (node === undefined) {
      continue
    }

    yield node

    // Reversed, so the first child is popped first and the walk reads in document order.
    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      const child = node.children[index]

      if (child !== undefined) {
        stack.push(child)
      }
    }
  }
}

/** Every node below `id`, excluding `id` itself. */
export function descendants(document: MotionDocument, id: NodeId): readonly Node[] {
  const all = [...walk(document, id)]

  return all.slice(1)
}

/** Root-last: the immediate parent first, then upward. Stops on a cycle rather than looping. */
export function ancestors(document: MotionDocument, id: NodeId): readonly Node[] {
  const found: Node[] = []
  const seen = new Set<NodeId>([id])
  let current = document.nodes[id]?.parentId ?? null

  while (current !== null && !seen.has(current)) {
    const parent = document.nodes[current]

    if (parent === undefined) {
      break
    }

    seen.add(current)
    found.push(parent)
    current = parent.parentId
  }

  return found
}

/**
 * Whether `candidate` sits anywhere below `ancestor`. This is the guard that stops a node being
 * dropped into its own subtree — EDITOR_ENGINE.md § Structural commands calls it the classic tree bug.
 */
export function isDescendant(
  document: MotionDocument,
  candidate: NodeId,
  ancestor: NodeId,
): boolean {
  if (candidate === ancestor) {
    return false
  }

  return ancestors(document, candidate).some((node) => node.id === ancestor)
}

/**
 * Position in a depth-first walk from the root, or `-1` for a node that is not reachable. Selection
 * ordering and copy/paste both need a total order, and document order is the one the user sees.
 */
export function documentOrderIndex(document: MotionDocument, id: NodeId): number {
  let index = 0

  for (const node of walk(document)) {
    if (node.id === id) {
      return index
    }

    index += 1
  }

  return -1
}

/** The ids reachable from the root, which is what invariants 4 and 5 are stated in terms of. */
export const reachableIds = (document: MotionDocument): ReadonlySet<NodeId> =>
  new Set([...walk(document)].map((node) => node.id))
