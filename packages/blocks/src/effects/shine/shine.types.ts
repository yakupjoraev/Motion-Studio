import type { z } from 'zod'

import type { shineSchema } from './shine.schema'

export type ShineProps = z.infer<typeof shineSchema>
