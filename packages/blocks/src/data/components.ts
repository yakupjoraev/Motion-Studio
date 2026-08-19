import { ChartPreview } from './chart-preview/chart-preview'
import { ProgressRing } from './progress-ring/progress-ring'
import { StatGrid } from './stat-grid/stat-grid'
import { Table } from './table/table'
import { Timeline } from './timeline/timeline'

/**
 * Eagerly, for the reason ADR-196 measured on the navigation category and ADR-210 restated for the interactive
 * one: what these blocks add to `/studio` is their *metadata*, which the store fixes at creation and no import
 * boundary can move. `lazy` would add five Suspense skeletons and a request each for a measured nothing.
 *
 * `chart-preview` was named in COMPONENT_LIBRARY.md § Lazy loading among the heavy blocks, and it is not one: it
 * takes no dependency and its whole implementation is two path strings, which is why its cost class is `cheap`.
 * That list was written before the block was, and the document was corrected in the prompt that built it.
 */
export const components = {
  table: Table,
  'stat-grid': StatGrid,
  'progress-ring': ProgressRing,
  timeline: Timeline,
  'chart-preview': ChartPreview,
} as const
