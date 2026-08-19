import { chartPreviewDefinition } from './chart-preview/chart-preview.definition'
import { progressRingDefinition } from './progress-ring/progress-ring.definition'
import { statGridDefinition } from './stat-grid/stat-grid.definition'
import { tableDefinition } from './table/table.definition'
import { timelineDefinition } from './timeline/timeline.definition'

// COMPONENT_LIBRARY.md § Catalogue (Data), which is the order the palette groups them in.
export const definitions = {
  table: tableDefinition,
  'stat-grid': statGridDefinition,
  'progress-ring': progressRingDefinition,
  timeline: timelineDefinition,
  'chart-preview': chartPreviewDefinition,
} as const
