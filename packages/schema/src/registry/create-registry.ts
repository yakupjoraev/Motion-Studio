import { MotionStudioError } from '@motion-studio/utils'

import type { BlockId } from '../ids/ids'

import type { BlockCategory, BlockDefinition, BlockRegistry } from './registry.types'

export const REGISTRY_CODES = {
  duplicateBlock: 'DUPLICATE_BLOCK',
  unknownBlock: 'UNKNOWN_BLOCK',
} as const

export class UnknownBlockError extends MotionStudioError {
  constructor(id: BlockId) {
    super(`No block is registered as ${JSON.stringify(id)}`, REGISTRY_CODES.unknownBlock)
  }
}

export class DuplicateBlockError extends MotionStudioError {
  constructor(id: BlockId) {
    super(`Two definitions claim the block id ${JSON.stringify(id)}`, REGISTRY_CODES.duplicateBlock)
  }
}

/**
 * Builds the lookup once, at construction. A duplicate id throws here rather than silently winning:
 * the registry is assembled from static imports, so two definitions with one id is a build mistake
 * and the only useful time to hear about it is the moment the module loads.
 *
 * `list()` preserves the order it was given, because the palette groups by category and reads in
 * catalogue order within each group.
 */
export function createRegistry(definitions: readonly BlockDefinition[]): BlockRegistry {
  const byId = new Map<string, BlockDefinition>()

  for (const definition of definitions) {
    if (byId.has(definition.id)) {
      throw new DuplicateBlockError(definition.id)
    }

    byId.set(definition.id, definition)
  }

  const ordered = [...definitions]

  return {
    get: (id) => byId.get(id),
    require(id) {
      const definition = byId.get(id)

      if (definition === undefined) {
        throw new UnknownBlockError(id)
      }

      return definition
    },
    list: () => ordered,
    byCategory: (category: BlockCategory) =>
      ordered.filter((definition) => definition.category === category),
  }
}
