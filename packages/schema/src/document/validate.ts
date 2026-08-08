import { type Result, err, ok } from '@motion-studio/utils'

import type { NodeId } from '../ids/ids'
import type { BlockRegistry, SlotDefinition } from '../registry/registry.types'

import type { MotionDocument, Node } from './document.types'
import { nodeIds, reachableIds } from './traverse'

/**
 * EDITOR_ENGINE.md § Invariants, one code each. The codes are what an import report groups by, so
 * they are stable strings rather than positions in this list.
 */
export const DOCUMENT_ERROR_CODES = {
  /** 1. `rootId` exists in `nodes`. */
  missingRoot: 'MISSING_ROOT',
  /** 2. Root's `parentId` is null; every other node's parent exists. */
  badParent: 'BAD_PARENT',
  /** 3. `nodes[p].children` contains `c` ⟺ `nodes[c].parentId === p`. */
  parentChildMismatch: 'PARENT_CHILD_MISMATCH',
  /** 4. No cycles. */
  cycle: 'CYCLE',
  /** 5. No orphans — every node is reachable from the root. */
  orphan: 'ORPHAN',
  /** 6. Every `blockId` exists in the registry. */
  unknownBlock: 'UNKNOWN_BLOCK',
  /** 7. Every node's `props` parse against its block's schema. */
  invalidProps: 'INVALID_PROPS',
  /** 8. Every child's `slot` is declared by its parent block. */
  unknownSlot: 'UNKNOWN_SLOT',
  /** 9. `children` contains no duplicates. */
  duplicateChild: 'DUPLICATE_CHILD',
} as const

export type DocumentErrorCode = (typeof DOCUMENT_ERROR_CODES)[keyof typeof DOCUMENT_ERROR_CODES]

export interface DocumentError {
  readonly code: DocumentErrorCode
  readonly message: string
  readonly nodeId?: NodeId
}

export interface ValidateOptions {
  /**
   * Invariants 6, 7 and 8 are questions about blocks, and only the registry can answer them. Without
   * one the other six still run — which is what lets the editor assert structure in a `node` test
   * with no block package loaded.
   */
  readonly registry?: BlockRegistry
}

const problem = (code: DocumentErrorCode, message: string, id?: NodeId): DocumentError =>
  id === undefined ? { code, message } : { code, message, nodeId: id }

/** Invariant 4. A separate walk from `traverse`, because that one is written to *survive* cycles. */
function findCycles(document: MotionDocument): readonly DocumentError[] {
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

const slotNames = (definition: { readonly slots: readonly SlotDefinition[] }): readonly string[] =>
  definition.slots.map((slot) => slot.name)

function checkStructure(document: MotionDocument, node: Node, id: NodeId): DocumentError[] {
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
  } else if (node.parentId === null) {
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

function checkAgainstRegistry(
  document: MotionDocument,
  node: Node,
  registry: BlockRegistry,
): DocumentError[] {
  const found: DocumentError[] = []
  const definition = registry.get(node.blockId)

  if (definition === undefined) {
    // Not fatal by itself — FILE_FORMAT.md § Repair vs reject keeps the node and renders a
    // placeholder — but it is still a reported violation.
    return [
      problem(
        DOCUMENT_ERROR_CODES.unknownBlock,
        `${node.id} uses the block ${node.blockId}, which is not registered`,
        node.id,
      ),
    ]
  }

  const parsed = definition.propsSchema.safeParse(node.props)

  if (!parsed.success) {
    found.push(
      problem(
        DOCUMENT_ERROR_CODES.invalidProps,
        `${node.id} has props that do not match ${node.blockId}: ${parsed.error.issues
          .map((issue) => issue.path.join('.') || '(root)')
          .join(', ')}`,
        node.id,
      ),
    )
  }

  if (node.parentId !== null) {
    const parent = document.nodes[node.parentId]
    const parentDefinition = parent === undefined ? undefined : registry.get(parent.blockId)

    if (parentDefinition !== undefined && !slotNames(parentDefinition).includes(node.slot)) {
      found.push(
        problem(
          DOCUMENT_ERROR_CODES.unknownSlot,
          `${node.id} sits in the slot ${JSON.stringify(node.slot)}, which ${parent?.blockId} does not declare`,
          node.id,
        ),
      )
    }
  }

  return found
}

/**
 * Reports **every** violation rather than the first: an import report needs the full picture, and a
 * user who fixes one problem to be told about the next one is being made to bisect their own file.
 *
 * Run on import, after migration, and in a dev-mode assertion after every command. Production skips
 * the walk — EDITOR_ENGINE.md § Invariants.
 */
export function validateDocument(
  document: MotionDocument,
  options: ValidateOptions = {},
): Result<void, DocumentError[]> {
  const found: DocumentError[] = []

  if (document.nodes[document.rootId] === undefined) {
    found.push(
      problem(
        DOCUMENT_ERROR_CODES.missingRoot,
        `The root ${document.rootId} is not in the document`,
      ),
    )

    // Every remaining invariant is stated in terms of the root. Continuing would produce a page of
    // errors that all say the same thing.
    return err(found)
  }

  for (const id of nodeIds(document)) {
    const node = document.nodes[id]

    if (node === undefined) {
      continue
    }

    found.push(...checkStructure(document, node, id))

    if (options.registry !== undefined) {
      found.push(...checkAgainstRegistry(document, node, options.registry))
    }
  }

  found.push(...findCycles(document))

  const reachable = reachableIds(document)

  for (const id of nodeIds(document)) {
    if (!reachable.has(id)) {
      found.push(problem(DOCUMENT_ERROR_CODES.orphan, `${id} is not reachable from the root`, id))
    }
  }

  return found.length === 0 ? ok(undefined) : err(found)
}

export interface PropValidationReport {
  readonly unknownBlocks: readonly DocumentError[]
  readonly invalidProps: readonly DocumentError[]
}

/**
 * FILE_FORMAT.md § Schema: the second pass, and non-fatal. A file whose blocks come from a newer
 * version still opens; the report is what the import dialog lists.
 */
export function validateProps(
  document: MotionDocument,
  registry: BlockRegistry,
): PropValidationReport {
  const found = [...walkRegistryErrors(document, registry)]

  return {
    unknownBlocks: found.filter((error) => error.code === DOCUMENT_ERROR_CODES.unknownBlock),
    invalidProps: found.filter((error) => error.code === DOCUMENT_ERROR_CODES.invalidProps),
  }
}

function* walkRegistryErrors(
  document: MotionDocument,
  registry: BlockRegistry,
): Generator<DocumentError> {
  for (const id of nodeIds(document)) {
    const node = document.nodes[id]

    if (node !== undefined) {
      yield* checkAgainstRegistry(document, node, registry)
    }
  }
}
