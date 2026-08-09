import type { BlockDefinition } from '@motion-studio/schema'
import type { TypeOf, ZodType } from 'zod'

import type { DefineBlockConfig } from './define-block.types'

/**
 * The typed door into the registry. Everything it does happens in the type system: the schema is the
 * source of the props type, so `defaults`, `previewProps` and every `controls[].path` are checked
 * against it — COMPONENT_LIBRARY.md § Adding a block, step 2, made enforceable.
 *
 * At runtime it is the identity function, and deliberately so: a definition is data, and a helper
 * that transformed it would put a second version of the block between the author and the exporter.
 */
export function defineBlock<S extends ZodType>(
  config: DefineBlockConfig<S>,
): BlockDefinition<TypeOf<S>> {
  return config
}
