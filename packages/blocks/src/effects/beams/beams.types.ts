import type { z } from 'zod'

import type { beamsSchema } from './beams.schema'

export type BeamsProps = z.infer<typeof beamsSchema>
