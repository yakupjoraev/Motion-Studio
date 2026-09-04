import type { BlockRegistry, SlotDefinition } from '../registry/registry.types'

import type { MotionDocument, Node } from './document.types'
import { nodeIds } from './traverse'
import { DOCUMENT_ERROR_CODES, type DocumentError, problem } from './validate.errors'

const slotNames = (definition: { readonly slots: readonly SlotDefinition[] }): readonly string[] =>
  definition.slots.map((slot) => slot.name)

/** Invariants 6, 7 and 8: the three a document cannot answer without the registry. */
export function checkAgainstRegistry(
  document: MotionDocument,
  node: Node,
  registry: BlockRegistry,
): readonly DocumentError[] {
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
