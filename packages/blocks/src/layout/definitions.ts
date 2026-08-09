import { containerDefinition } from './container/container.definition'
import { sectionDefinition } from './section/section.definition'

/**
 * Metadata only, and reached through the block's `.definition` file rather than through its `index`:
 * an index re-exports the component, and one React import anywhere in this graph is what would stop
 * `codegen` from running under `node` (ADR-107).
 */
export const definitions = {
  section: sectionDefinition,
  container: containerDefinition,
} as const
