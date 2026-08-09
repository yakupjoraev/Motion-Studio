import { columnsDefinition } from './columns/columns.definition'
import { containerDefinition } from './container/container.definition'
import { dividerDefinition } from './divider/divider.definition'
import { gridDefinition } from './grid/grid.definition'
import { sectionDefinition } from './section/section.definition'
import { spacerDefinition } from './spacer/spacer.definition'
import { stackDefinition } from './stack/stack.definition'

/**
 * Metadata only, and reached through the block's `.definition` file rather than through its `index`:
 * an index re-exports the component, and one React import anywhere in this graph is what would stop
 * `codegen` from running under `node` (ADR-107).
 */
// COMPONENT_LIBRARY.md § Catalogue order, which is the order the palette groups them in.
export const definitions = {
  section: sectionDefinition,
  container: containerDefinition,
  stack: stackDefinition,
  grid: gridDefinition,
  columns: columnsDefinition,
  spacer: spacerDefinition,
  divider: dividerDefinition,
} as const
