import type { z } from 'zod'

import type { auroraBackgroundSchema } from './aurora-background.schema'

export type AuroraBackgroundProps = z.infer<typeof auroraBackgroundSchema>
