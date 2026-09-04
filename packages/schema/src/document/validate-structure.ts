import type { NodeId } from '../ids/ids'

import type { MotionDocument, Node } from './document.types'
import { nodeIds } from './traverse'
import { DOCUMENT_ERROR_CODES, type DocumentError, problem } from './validate.errors'

/** Invariant 4. A separate walk from `traverse`, because that one is written to *survive* cycles. */
export function findCycles(document: MotionDocument): readonly DocumentError[] {
  const found: DocumentError[] = []
  const state = new Map<NodeId, 'open' | 'closed'>()

  const visit = (id: NodeId, path: readonly NodeId[]): void => {
    if (state.get(id) === 'open') {
      found.push(
        problem(
          DOCUMENT_ERROR_CODES.cycle,
          `${id} is its own ancestor via ${[...path, id].join(' → ')}`,
          id,
        ),
      )

      return
    }

    if (state.get(id) === 'closed') {
      return
    }

    state.set(id, 'open')

    for (const child of document.nodes[id]?.children ?? []) {
      visit(child, [...path, id])
    }

    state.set(id, 'closed')
  }

  for (const id of nodeIds(document)) {
    if (!state.has(id)) {
      visit(id, [])
    }
  }

  return found
}

/** Invariants 2, 3 and 9: the ones a document answers about itself, with no registry involved. */
export function checkStructure(
  document: MotionDocument,
  node: Node,
  id: NodeId,
): readonly DocumentError[] {
  const found: DocumentError[] = [...checkParent(document, node, id)]
  const seen = new Set<NodeId>()

  for (const child of node.children) {
    if (seen.has(child)) {
      found.push(
        problem(DOCUMENT_ERROR_CODES.duplicateChild, `${id} lists ${child} more than once`, id),
      )
    }

    seen.add(child)

    const target = document.nodes[child]

    if (target === undefined) {
      found.push(
        problem(
          DOCUMENT_ERROR_CODES.parentChildMismatch,
          `${id} lists ${child}, which is not in the document`,
          id,
        ),
      )
    } else if (target.parentId !== id) {
      found.push(
        problem(
          DOCUMENT_ERROR_CODES.parentChildMismatch,
          `${id} lists ${child}, whose parent is ${String(target.parentId)}`,
          id,
        ),
      )
    }
  }

  return found
}

/** The upward half: the key a node is stored under, and the parent it names. */
function checkParent(document: MotionDocument, node: Node, id: NodeId): readonly DocumentError[] {
  const found: DocumentError[] = []

  if (node.id !== id) {
    found.push(
      problem(
        DOCUMENT_ERROR_CODES.badParent,
        `${id} is stored under a key that is not its id (${node.id})`,
        id,
      ),
    )
  }

  if (id === document.rootId) {
    if (node.parentId !== null) {
      found.push(problem(DOCUMENT_ERROR_CODES.badParent, `The root ${id} has a parent`, id))
    }

    return found
  }

  if (node.parentId === null) {
    found.push(
      problem(DOCUMENT_ERROR_CODES.badParent, `${id} is not the root and has no parent`, id),
    )
  } else if (document.nodes[node.parentId] === undefined) {
    found.push(problem(DOCUMENT_ERROR_CODES.badParent, `${id} names a parent that is missing`, id))
  } else if (!(document.nodes[node.parentId]?.children ?? []).includes(id)) {
    found.push(
      problem(
        DOCUMENT_ERROR_CODES.parentChildMismatch,
        `${id} claims ${node.parentId} as its parent, which does not list it`,
        id,
      ),
    )
  }

  return found
}
