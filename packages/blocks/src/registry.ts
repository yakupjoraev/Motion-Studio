import { type BlockDefinition, type BlockRegistry, createRegistry } from '@motion-studio/schema'

import { definitions as content } from './content/definitions'
import { definitions as effects } from './effects/definitions'
import { definitions as hero } from './hero/definitions'
import { definitions as interactive } from './interactive/definitions'
import { definitions as layout } from './layout/definitions'
import { definitions as marketing } from './marketing/definitions'
import { definitions as navigation } from './navigation/definitions'

/**
 * The catalogue, in the order COMPONENT_LIBRARY.md § Catalogue lists it — `list()` preserves that
 * order and the palette groups by category within it.
 *
 * **No React in this module's graph.** ADR-107: `renderRegistry` lives in its own file, because the
 * value of the split is that `codegen` and `editor` can import the metadata under `node`, and one
 * component import anywhere here would take that away.
 */
export const DEFINITIONS: readonly BlockDefinition[] = [
  ...Object.values(layout),
  ...Object.values(hero),
  ...Object.values(content),
  ...Object.values(marketing),
  ...Object.values(navigation),
  ...Object.values(interactive),
  ...Object.values(effects),
]

export const blockRegistry: BlockRegistry = createRegistry(DEFINITIONS)
