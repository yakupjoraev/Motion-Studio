import type { z } from 'zod'

import type { borderBeamSchema } from './border-beam.schema'

export type BorderBeamProps = z.infer<typeof borderBeamSchema>
