import type { z } from 'zod'

import type { scanlinesSchema } from './scanlines.schema'

export type ScanlinesProps = z.infer<typeof scanlinesSchema>
