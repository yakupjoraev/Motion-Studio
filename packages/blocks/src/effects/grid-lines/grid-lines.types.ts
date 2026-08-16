import type { z } from 'zod'

import type { gridLinesSchema } from './grid-lines.schema'

export type GridLinesProps = z.infer<typeof gridLinesSchema>
