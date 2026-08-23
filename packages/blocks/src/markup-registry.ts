import type { MarkupRegistry } from '@motion-studio/schema'

import { columnsMarkup } from './layout/columns/columns.markup'
import { containerMarkup } from './layout/container/container.markup'
import { dividerMarkup } from './layout/divider/divider.markup'
import { gridMarkup } from './layout/grid/grid.markup'
import { sectionMarkup } from './layout/section/section.markup'
import { spacerMarkup } from './layout/spacer/spacer.markup'
import { stackMarkup } from './layout/stack/stack.markup'

/**
 * What each block exports as — ADR-249, injected into `buildIR` for ADR-226's reason: it lives here
 * and `codegen` may not import this package.
 *
 * It is a registry of **code** rather than a field on the descriptor, which stays data. That is the
 * distinction ADR-225 drew and `registry.node.test.ts` guards: a producer calls its block's `cva`, and
 * a `.styles.ts` module has no business in the metadata half of the registry.
 *
 * A block absent from this map exports as its root element alone, which is what every block did before
 * producers existed. `registry.markup.test.tsx` compares each producer's DOM with its component's, and
 * prompt 45c is where the last entry lands and the absence becomes an error.
 */
export const markupRegistry: MarkupRegistry = {
  columns: columnsMarkup,
  container: containerMarkup,
  divider: dividerMarkup,
  grid: gridMarkup,
  section: sectionMarkup,
  spacer: spacerMarkup,
  stack: stackMarkup,
}
