import type { z } from 'zod'

import type { dotGridSchema } from './dot-grid.schema'

export type DotGridProps = z.infer<typeof dotGridSchema>
