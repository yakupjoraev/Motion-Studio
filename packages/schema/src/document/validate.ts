import { type Result, err, ok } from '@motion-studio/utils'

import type { BlockRegistry } from '../registry/registry.types'

import type { MotionDocument } from './document.types'
import { nodeIds, reachableIds } from './traverse'
import { checkAgainstRegistry } from './validate-registry'
import { checkStructure, findCycles } from './validate-structure'
import { DOCUMENT_ERROR_CODES, type DocumentError, problem } from './validate.errors'

export interface ValidateOptions {
  /**
   * Invariants 6, 7 and 8 are questions about blocks, and only the registry can answer them. Without
   * one the other six still run — which is what lets the editor assert structure in a `node` test
   * with no block package loaded.
   */
  readonly registry?: BlockRegistry
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
